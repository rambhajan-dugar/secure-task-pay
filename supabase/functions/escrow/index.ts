import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = authData.claims.sub as string;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // GET /escrow - Get user's escrow transactions
    if (req.method === 'GET' && pathParts.length === 1) {
      const role = url.searchParams.get('role'); // 'poster' or 'doer'
      const status = url.searchParams.get('status');

      let query = supabase
        .from('escrow_transactions')
        .select(`
          *,
          tasks (
            id,
            title,
            status,
            task_code
          )
        `);

      if (role === 'poster') {
        query = query.eq('poster_id', userId);
      } else if (role === 'doer') {
        query = query.eq('doer_id', userId);
      } else {
        query = query.or(`poster_id.eq.${userId},doer_id.eq.${userId}`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ transactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /escrow/:id - Get single escrow transaction
    if (req.method === 'GET' && pathParts.length === 2) {
      const escrowId = pathParts[1];

      const { data: escrow, error } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          tasks (*)
        `)
        .eq('id', escrowId)
        .maybeSingle();

      if (error || !escrow) {
        return new Response(JSON.stringify({ error: 'Escrow not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ escrow }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /escrow/release - Manual release (admin only in production)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'release') {
      const body = await req.json();
      const { task_id } = body;

      if (!task_id) {
        return new Response(JSON.stringify({ error: 'task_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get task and escrow
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task_id)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only poster can release
      if (task.poster_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only task poster can release escrow' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', task_id)
        .single();

      if (escrowError || !escrow) {
        return new Response(JSON.stringify({ error: 'Escrow not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Prevent double release
      if (escrow.status === 'released') {
        return new Response(JSON.stringify({ error: 'Payment already released' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Use service role client for wallet update
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Credit doer wallet (sandbox)
      const { data: doerProfile } = await serviceClient
        .from('profiles')
        .select('wallet_balance, tasks_completed, total_earnings')
        .eq('user_id', task.doer_id)
        .single();

      if (doerProfile) {
        await serviceClient
          .from('profiles')
          .update({
            wallet_balance: (doerProfile.wallet_balance || 0) + escrow.net_payout,
            tasks_completed: (doerProfile.tasks_completed || 0) + 1,
            total_earnings: (doerProfile.total_earnings || 0) + escrow.net_payout,
          })
          .eq('user_id', task.doer_id);
      }

      // Update escrow status
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('id', escrow.id);

      // Update task status
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          approved_at: new Date().toISOString(),
        })
        .eq('id', task_id);

      return new Response(JSON.stringify({ 
        success: true,
        released_amount: escrow.net_payout,
        platform_fee: escrow.platform_fee,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
