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

    // Check if user is frozen
    const { data: freezeData } = await serviceClient
      .from('user_freezes')
      .select('id')
      .eq('user_id', userId)
      .is('unfrozen_at', null)
      .single();

    if (freezeData) {
      return new Response(JSON.stringify({ error: 'Account is frozen' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/wallet - Get wallet balance and transactions
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

      // Get recent wallet events
      const { data: events } = await supabase
        .from('wallet_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get recent escrow transactions (released)
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
        wallet_events: events || [],
        recent_transactions: transactions || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/wallet/events - Get wallet event history
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'events') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const eventType = url.searchParams.get('type');

      let query = supabase
        .from('wallet_events')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: events, count, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        events: events || [],
        total: count,
        limit,
        offset
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/wallet/add-funds (sandbox - simulates adding funds)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'add-funds') {
      const body = await req.json();
      const { amount } = body;

      if (!amount || amount <= 0 || amount > 1000000) {
        return new Response(JSON.stringify({ error: 'Invalid amount (max ₹10,00,000)' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ action: 'add-funds', amount });
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

      // Rate limit wallet operations
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - 1);
      const { count } = await serviceClient
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', userId)
        .eq('endpoint', 'wallet_add')
        .gte('window_start', windowStart.toISOString());

      if ((count || 0) >= 10) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 wallet operations per hour.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

      const balanceBefore = profile?.wallet_balance || 0;
      const balanceAfter = balanceBefore + amount;

      // ATOMIC: Update wallet + log event
      await serviceClient
        .from('profiles')
        .update({ wallet_balance: balanceAfter })
        .eq('user_id', userId);

      await serviceClient.from('wallet_events').insert({
        user_id: userId,
        event_type: 'sandbox_deposit',
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        actor_id: userId,
        metadata: { source: 'sandbox' }
      });

      await serviceClient.from('rate_limits').insert({
        identifier: userId,
        endpoint: 'wallet_add',
        window_start: new Date().toISOString()
      });

      const response = { 
        success: true,
        added: amount,
        new_balance: balanceAfter,
        message: 'Sandbox funds added successfully',
      };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ action: 'add-funds', amount });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'wallet_add',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/wallet/withdraw (sandbox - simulates withdrawal)
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'withdraw') {
      const body = await req.json();
      const { amount } = body;

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ action: 'withdraw', amount });
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

      // Rate limit
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - 1);
      const { count } = await serviceClient
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', userId)
        .eq('endpoint', 'wallet_withdraw')
        .gte('window_start', windowStart.toISOString());

      if ((count || 0) >= 5) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 5 withdrawals per hour.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const balanceBefore = profile.wallet_balance || 0;

      if (amount > balanceBefore) {
        return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Prevent negative balance
      if (balanceBefore - amount < 0) {
        return new Response(JSON.stringify({ error: 'Would result in negative balance' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const balanceAfter = balanceBefore - amount;

      // ATOMIC: Update wallet + log event
      await serviceClient
        .from('profiles')
        .update({ wallet_balance: balanceAfter })
        .eq('user_id', userId);

      await serviceClient.from('wallet_events').insert({
        user_id: userId,
        event_type: 'sandbox_withdrawal',
        amount: -amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        actor_id: userId,
        metadata: { source: 'sandbox' }
      });

      await serviceClient.from('rate_limits').insert({
        identifier: userId,
        endpoint: 'wallet_withdraw',
        window_start: new Date().toISOString()
      });

      const response = { 
        success: true,
        withdrawn: amount,
        new_balance: balanceAfter,
        message: 'Sandbox withdrawal successful (no real money transferred)',
      };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ action: 'withdraw', amount });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'wallet_withdraw',
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
    console.error('Wallet error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
