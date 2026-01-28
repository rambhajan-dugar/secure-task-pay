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

    // GET /wallet - Get wallet balance and transactions
    if (req.method === 'GET' && pathParts.length === 1) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance, total_earnings, tasks_completed')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get recent escrow transactions (payments received)
      const { data: transactions } = await supabase
        .from('escrow_transactions')
        .select(`
          id,
          gross_amount,
          platform_fee,
          net_payout,
          status,
          released_at,
          tasks (
            id,
            title,
            task_code
          )
        `)
        .eq('doer_id', userId)
        .eq('status', 'released')
        .order('released_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ 
        wallet_balance: profile.wallet_balance || 0,
        total_earnings: profile.total_earnings || 0,
        tasks_completed: profile.tasks_completed || 0,
        recent_transactions: transactions || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /wallet/add-funds (sandbox - simulates adding funds)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'add-funds') {
      const body = await req.json();
      const { amount } = body;

      if (!amount || amount <= 0 || amount > 1000000) {
        return new Response(JSON.stringify({ error: 'Invalid amount (max ₹10,00,000)' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

      const newBalance = (profile?.wallet_balance || 0) + amount;

      await serviceClient
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', userId);

      return new Response(JSON.stringify({ 
        success: true,
        added: amount,
        new_balance: newBalance,
        message: 'Sandbox funds added successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /wallet/withdraw (sandbox - simulates withdrawal)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'withdraw') {
      const body = await req.json();
      const { amount } = body;

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (amount > (profile.wallet_balance || 0)) {
        return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const newBalance = (profile.wallet_balance || 0) - amount;

      await serviceClient
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', userId);

      return new Response(JSON.stringify({ 
        success: true,
        withdrawn: amount,
        new_balance: newBalance,
        message: 'Sandbox withdrawal successful (no real money transferred)',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Wallet error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
