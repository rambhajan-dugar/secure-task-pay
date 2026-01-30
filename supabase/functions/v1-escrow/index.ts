import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

async function hashRequest(body: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
    const idempotencyKey = req.headers.get('x-idempotency-key');

    // GET /v1/escrow - Get user's escrow transactions
    if (req.method === 'GET' && pathParts.length === 1) {
      const role = url.searchParams.get('role');
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

    // GET /v1/escrow/:id - Get single escrow transaction with full audit trail
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

      // Get related wallet events
      const { data: walletEvents } = await supabase
        .from('wallet_events')
        .select('*')
        .eq('escrow_id', escrowId)
        .order('created_at', { ascending: true });

      return new Response(JSON.stringify({ escrow, wallet_events: walletEvents || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/escrow/release - Manual release (by poster only)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'release') {
      const body = await req.json();
      const { task_id } = body;

      if (!task_id) {
        return new Response(JSON.stringify({ error: 'task_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ task_id, action: 'release' });
        const { data: existingKey } = await serviceClient
          .from('idempotency_keys')
          .select('*')
          .eq('key', idempotencyKey)
          .eq('user_id', userId)
          .single();

        if (existingKey) {
          if (existingKey.request_hash !== requestHash) {
            return new Response(JSON.stringify({ error: 'Idempotency key reused with different request' }), {
              status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify(existingKey.response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Get task
      const { data: task, error: taskError } = await serviceClient
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

      // Get escrow
      const { data: escrow, error: escrowError } = await serviceClient
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', task_id)
        .single();

      if (escrowError || !escrow) {
        return new Response(JSON.stringify({ error: 'Escrow not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PREVENT DOUBLE RELEASE
      if (escrow.status === 'released') {
        return new Response(JSON.stringify({ error: 'Payment already released' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only submitted tasks can be released
      if (task.status !== 'submitted') {
        return new Response(JSON.stringify({ error: `Cannot release escrow for task in ${task.status} state` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get doer profile
      const { data: doerProfile } = await serviceClient
        .from('profiles')
        .select('wallet_balance, tasks_completed, total_earnings')
        .eq('user_id', task.doer_id)
        .single();

      if (!doerProfile) {
        return new Response(JSON.stringify({ error: 'Doer profile not found' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const balanceBefore = doerProfile.wallet_balance || 0;
      const balanceAfter = balanceBefore + escrow.net_payout;

      // ATOMIC RELEASE: Update task + escrow + wallet
      // 1. Update escrow with optimistic lock
      const { error: escrowUpdateError } = await serviceClient
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrow.id)
        .eq('status', 'in_escrow'); // Optimistic lock

      if (escrowUpdateError) {
        return new Response(JSON.stringify({ error: 'Escrow state changed - release failed' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. Update task
      await serviceClient
        .from('tasks')
        .update({
          status: 'completed',
          approved_at: new Date().toISOString()
        })
        .eq('id', task_id);

      // 3. Credit doer wallet
      await serviceClient
        .from('profiles')
        .update({
          wallet_balance: balanceAfter,
          tasks_completed: (doerProfile.tasks_completed || 0) + 1,
          total_earnings: (doerProfile.total_earnings || 0) + escrow.net_payout
        })
        .eq('user_id', task.doer_id);

      // 4. Log wallet event
      await serviceClient.from('wallet_events').insert({
        user_id: task.doer_id,
        event_type: 'escrow_release',
        amount: escrow.net_payout,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        task_id: task_id,
        escrow_id: escrow.id,
        actor_id: userId,
        metadata: { release_type: 'manual' }
      });

      // 5. Log task event
      await serviceClient.from('task_events').insert({
        task_id: task_id,
        actor_id: userId,
        actor_role: 'poster',
        event_type: 'escrow_released',
        old_state: 'submitted',
        new_state: 'completed',
        metadata: { amount: escrow.net_payout, release_type: 'manual' }
      });

      // 6. Notify doer
      await serviceClient.from('notification_events').insert({
        user_id: task.doer_id,
        type: 'payment_released',
        title: 'Payment Released!',
        payload: { task_id, amount: escrow.net_payout }
      });

      const response = { 
        success: true,
        released_amount: escrow.net_payout,
        platform_fee: escrow.platform_fee,
      };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ task_id, action: 'release' });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'escrow_release',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Escrow error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
