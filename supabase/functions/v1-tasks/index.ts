import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

const PLATFORM_FEE_PERCENT = 12.5;
const VALID_TRANSITIONS: Record<string, string[]> = {
  'open': ['accepted', 'cancelled'],
  'accepted': ['in_progress', 'cancelled'],
  'in_progress': ['submitted'],
  'submitted': ['approved', 'disputed', 'completed'],
  'approved': ['completed'],
  'disputed': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': []
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

    // Rate limiting for task creation
    if (req.method === 'POST' && pathParts.length === 1) {
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - 1);
      
      const { count } = await serviceClient
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', userId)
        .eq('endpoint', 'task_create')
        .gte('window_start', windowStart.toISOString());

      if ((count || 0) >= 10) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 tasks per hour.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /v1/tasks - List tasks
    if (req.method === 'GET' && pathParts.length === 1) {
      const status = url.searchParams.get('status');
      const role = url.searchParams.get('role');
      const category = url.searchParams.get('category');

      let query = supabase
        .from('tasks')
        .select(`
          *,
          escrow_transactions (
            id,
            status,
            gross_amount,
            net_payout,
            auto_release_at
          )
        `)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);
      if (role === 'poster') query = query.eq('poster_id', userId);
      if (role === 'doer') query = query.eq('doer_id', userId);

      const { data: tasks, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/tasks/:id - Get single task with full details
    if (req.method === 'GET' && pathParts.length === 2) {
      const taskId = pathParts[1];

      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          escrow_transactions (*),
          submissions (*),
          task_events (*)
        `)
        .eq('id', taskId)
        .single();

      if (error || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ task }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks - Create task (atomic with escrow)
    if (req.method === 'POST' && pathParts.length === 1) {
      const body = await req.json();
      const { title, description, category, reward_amount, deadline, is_in_person, location_address, location_lat, location_lng } = body;

      if (!title || !description || !reward_amount || !deadline) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (reward_amount < 100 || reward_amount > 10000000) {
        return new Response(JSON.stringify({ error: 'Reward must be between ₹100 and ₹1,00,00,000' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest(body);
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

      // Calculate fees server-side
      const platformFee = Math.round(reward_amount * PLATFORM_FEE_PERCENT / 100);
      const netPayout = reward_amount - platformFee;

      // ATOMIC: Create task + escrow in transaction-like manner
      const { data: task, error: taskError } = await serviceClient
        .from('tasks')
        .insert({
          title,
          description,
          category: category || 'other',
          reward_amount,
          deadline,
          poster_id: userId,
          status: 'open',
          is_in_person: is_in_person || false,
          location_address,
          location_lat,
          location_lng
        })
        .select()
        .single();

      if (taskError || !task) {
        console.error('Task creation failed:', taskError);
        return new Response(JSON.stringify({ error: 'Failed to create task' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create escrow transaction
      const { data: escrow, error: escrowError } = await serviceClient
        .from('escrow_transactions')
        .insert({
          task_id: task.id,
          poster_id: userId,
          gross_amount: reward_amount,
          platform_fee: platformFee,
          net_payout: netPayout,
          fee_percentage: PLATFORM_FEE_PERCENT,
          status: 'in_escrow'
        })
        .select()
        .single();

      if (escrowError) {
        // Rollback: delete task
        await serviceClient.from('tasks').delete().eq('id', task.id);
        console.error('Escrow creation failed:', escrowError);
        return new Response(JSON.stringify({ error: 'Failed to create escrow' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log task event
      await serviceClient.from('task_events').insert({
        task_id: task.id,
        actor_id: userId,
        actor_role: 'poster',
        event_type: 'task_created',
        old_state: null,
        new_state: 'open',
        metadata: { reward_amount, platform_fee: platformFee }
      });

      // Create notification
      await serviceClient.from('notification_events').insert({
        user_id: userId,
        type: 'task_created',
        title: 'Task Created',
        payload: { task_id: task.id, task_code: task.task_code }
      });

      // Record rate limit
      await serviceClient.from('rate_limits').insert({
        identifier: userId,
        endpoint: 'task_create',
        window_start: new Date().toISOString()
      });

      const response = { task, escrow };

      // Store idempotency response
      if (idempotencyKey) {
        const requestHash = await hashRequest(body);
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'task_create',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks/:id/accept
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'accept') {
      const taskId = pathParts[1];

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'accept' });
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

      // Rate limit accepts
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - 1);
      const { count } = await serviceClient
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', userId)
        .eq('endpoint', 'task_accept')
        .gte('window_start', windowStart.toISOString());

      if ((count || 0) >= 5) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 5 accepts per hour.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: task, error: taskError } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validation
      if (task.poster_id === userId) {
        return new Response(JSON.stringify({ error: 'Cannot accept your own task' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.status !== 'open') {
        return new Response(JSON.stringify({ error: `Invalid state transition: ${task.status} → accepted` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ATOMIC: Update task + escrow
      const { error: updateError } = await serviceClient
        .from('tasks')
        .update({
          status: 'accepted',
          doer_id: userId,
          accepted_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'open'); // Optimistic lock

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to accept task - may have been taken' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update escrow with doer
      await serviceClient
        .from('escrow_transactions')
        .update({ doer_id: userId })
        .eq('task_id', taskId);

      // Log event
      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: userId,
        actor_role: 'doer',
        event_type: 'task_accepted',
        old_state: 'open',
        new_state: 'accepted',
        metadata: {}
      });

      // Notify poster
      await serviceClient.from('notification_events').insert({
        user_id: task.poster_id,
        type: 'task_accepted',
        title: 'Task Accepted',
        payload: { task_id: taskId, doer_id: userId }
      });

      // Record rate limit
      await serviceClient.from('rate_limits').insert({
        identifier: userId,
        endpoint: 'task_accept',
        window_start: new Date().toISOString()
      });

      const response = { success: true, message: 'Task accepted' };

      // Store idempotency
      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'accept' });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'task_accept',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks/:id/start
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'start') {
      const taskId = pathParts[1];

      const { data: task } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.doer_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only assigned doer can start task' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.status !== 'accepted') {
        return new Response(JSON.stringify({ error: `Invalid state transition: ${task.status} → in_progress` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await serviceClient
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);

      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: userId,
        actor_role: 'doer',
        event_type: 'task_started',
        old_state: 'accepted',
        new_state: 'in_progress',
        metadata: {}
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks/:id/submit
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'submit') {
      const taskId = pathParts[1];
      const body = await req.json();
      const { message, attachments } = body;

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'submit', message });
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

      const { data: task } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.doer_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only assigned doer can submit' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.status !== 'in_progress') {
        return new Response(JSON.stringify({ error: `Invalid state transition: ${task.status} → submitted` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const autoReleaseAt = new Date();
      autoReleaseAt.setHours(autoReleaseAt.getHours() + 24);

      // ATOMIC: Update task + create submission
      const { error: updateError } = await serviceClient
        .from('tasks')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          auto_release_at: autoReleaseAt.toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'in_progress');

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to submit - task state changed' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create submission record
      const { data: submission } = await serviceClient
        .from('submissions')
        .insert({
          task_id: taskId,
          submitted_by: userId,
          message,
          attachments: attachments || []
        })
        .select()
        .single();

      // Update escrow auto-release
      await serviceClient
        .from('escrow_transactions')
        .update({ auto_release_at: autoReleaseAt.toISOString() })
        .eq('task_id', taskId);

      // Log event
      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: userId,
        actor_role: 'doer',
        event_type: 'task_submitted',
        old_state: 'in_progress',
        new_state: 'submitted',
        metadata: { auto_release_at: autoReleaseAt.toISOString() }
      });

      // Notify poster
      await serviceClient.from('notification_events').insert({
        user_id: task.poster_id,
        type: 'task_submitted',
        title: 'Task Submitted for Review',
        payload: { task_id: taskId, auto_release_at: autoReleaseAt.toISOString() }
      });

      const response = { success: true, submission, auto_release_at: autoReleaseAt.toISOString() };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'submit', message });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'task_submit',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks/:id/approve (ATOMIC with wallet credit)
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'approve') {
      const taskId = pathParts[1];

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'approve' });
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

      const { data: task } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.poster_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only task poster can approve' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.status !== 'submitted') {
        return new Response(JSON.stringify({ error: `Invalid state transition: ${task.status} → approved` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get escrow
      const { data: escrow } = await serviceClient
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (!escrow || escrow.status === 'released') {
        return new Response(JSON.stringify({ error: 'Escrow already released or not found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get doer profile for wallet update
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

      // ATOMIC: Update task + escrow + wallet
      // 1. Update task status
      const { error: taskUpdateError } = await serviceClient
        .from('tasks')
        .update({
          status: 'completed',
          approved_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('status', 'submitted'); // Optimistic lock

      if (taskUpdateError) {
        return new Response(JSON.stringify({ error: 'Task state changed - approval failed' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. Update escrow
      await serviceClient
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

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
        task_id: taskId,
        escrow_id: escrow.id,
        actor_id: userId,
        metadata: { approval_type: 'manual' }
      });

      // 5. Log task event
      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: userId,
        actor_role: 'poster',
        event_type: 'task_approved',
        old_state: 'submitted',
        new_state: 'completed',
        metadata: { payout: escrow.net_payout }
      });

      // 6. Notify doer
      await serviceClient.from('notification_events').insert({
        user_id: task.doer_id,
        type: 'task_approved',
        title: 'Payment Released!',
        payload: { task_id: taskId, amount: escrow.net_payout }
      });

      const response = { 
        success: true, 
        released_amount: escrow.net_payout,
        platform_fee: escrow.platform_fee,
        new_balance: balanceAfter
      };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'approve' });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'task_approve',
          request_hash: requestHash,
          response
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/tasks/:id/dispute
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'dispute') {
      const taskId = pathParts[1];
      const body = await req.json();
      const { reason, description } = body;

      if (!reason) {
        return new Response(JSON.stringify({ error: 'Reason is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Idempotency check
      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'dispute', reason });
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

      const { data: task } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only poster can dispute submitted work
      if (task.poster_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only task poster can dispute' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (task.status !== 'submitted') {
        return new Response(JSON.stringify({ error: `Cannot dispute task in ${task.status} state` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get escrow
      const { data: escrow } = await serviceClient
        .from('escrow_transactions')
        .select('id')
        .eq('task_id', taskId)
        .single();

      // ATOMIC: Update task + create dispute
      const { error: updateError } = await serviceClient
        .from('tasks')
        .update({ status: 'disputed' })
        .eq('id', taskId)
        .eq('status', 'submitted');

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to dispute - task state changed' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update escrow
      await serviceClient
        .from('escrow_transactions')
        .update({ status: 'disputed' })
        .eq('task_id', taskId);

      // Create dispute record
      const { data: dispute } = await serviceClient
        .from('disputes')
        .insert({
          task_id: taskId,
          escrow_id: escrow?.id,
          raised_by_id: userId,
          raised_by_role: 'poster',
          reason,
          description,
          status: 'open'
        })
        .select()
        .single();

      // Log event
      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: userId,
        actor_role: 'poster',
        event_type: 'task_disputed',
        old_state: 'submitted',
        new_state: 'disputed',
        metadata: { reason, dispute_id: dispute?.id }
      });

      // Notify doer
      await serviceClient.from('notification_events').insert({
        user_id: task.doer_id,
        type: 'task_disputed',
        title: 'Task Disputed',
        payload: { task_id: taskId, reason }
      });

      const response = { success: true, dispute };

      if (idempotencyKey) {
        const requestHash = await hashRequest({ taskId, action: 'dispute', reason });
        await serviceClient.from('idempotency_keys').insert({
          key: idempotencyKey,
          user_id: userId,
          endpoint: 'task_dispute',
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
    console.error('Task API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
