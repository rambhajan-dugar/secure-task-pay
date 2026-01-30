import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin-only endpoints for dispute resolution, user management, and audit
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

    const adminId = authData.claims.sub as string;

    // Verify admin role
    const { data: isAdmin } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .single();

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // GET /v1/admin/disputes - List all disputes
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'disputes') {
      const status = url.searchParams.get('status');
      
      let query = serviceClient
        .from('disputes')
        .select(`
          *,
          tasks (
            id,
            title,
            task_code,
            reward_amount,
            poster_id,
            doer_id
          ),
          escrow_transactions:escrow_id (
            id,
            gross_amount,
            net_payout,
            platform_fee,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: disputes, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ disputes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/admin/disputes/:id/resolve - Resolve dispute
    if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'disputes' && pathParts[3] === 'resolve') {
      const disputeId = pathParts[2];
      const body = await req.json();
      const { resolution_type, poster_refund_percent, doer_payout_percent, resolution_notes } = body;

      if (!resolution_type || !['full_release', 'full_refund', 'split'].includes(resolution_type)) {
        return new Response(JSON.stringify({ error: 'Invalid resolution_type. Must be: full_release, full_refund, or split' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resolution_type === 'split' && (poster_refund_percent === undefined || doer_payout_percent === undefined)) {
        return new Response(JSON.stringify({ error: 'Split resolution requires poster_refund_percent and doer_payout_percent' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get dispute with related data
      const { data: dispute, error: disputeError } = await serviceClient
        .from('disputes')
        .select(`
          *,
          tasks (*),
          escrow_transactions:escrow_id (*)
        `)
        .eq('id', disputeId)
        .single();

      if (disputeError || !dispute) {
        return new Response(JSON.stringify({ error: 'Dispute not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (dispute.status !== 'open') {
        return new Response(JSON.stringify({ error: 'Dispute already resolved' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const task = dispute.tasks;
      const escrow = dispute.escrow_transactions;

      if (!escrow || escrow.status === 'released' || escrow.status === 'refunded') {
        return new Response(JSON.stringify({ error: 'Escrow already processed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let posterRefund = 0;
      let doerPayout = 0;
      let resolvedInFavor = '';

      if (resolution_type === 'full_release') {
        doerPayout = escrow.net_payout;
        resolvedInFavor = 'doer';
      } else if (resolution_type === 'full_refund') {
        posterRefund = escrow.gross_amount;
        resolvedInFavor = 'poster';
      } else if (resolution_type === 'split') {
        posterRefund = Math.round(escrow.gross_amount * (poster_refund_percent / 100));
        doerPayout = Math.round(escrow.net_payout * (doer_payout_percent / 100));
        resolvedInFavor = 'split';
      }

      // ATOMIC: Process resolution
      // 1. Update dispute
      await serviceClient
        .from('disputes')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: adminId,
          resolved_in_favor_of: resolvedInFavor,
          resolution_type,
          poster_refund_amount: posterRefund,
          doer_payout_amount: doerPayout,
          resolution_notes
        })
        .eq('id', disputeId);

      // 2. Update escrow
      await serviceClient
        .from('escrow_transactions')
        .update({
          status: resolution_type === 'full_refund' ? 'refunded' : 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      // 3. Update task
      await serviceClient
        .from('tasks')
        .update({
          status: 'completed',
          approved_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // 4. Credit doer if applicable
      if (doerPayout > 0) {
        const { data: doerProfile } = await serviceClient
          .from('profiles')
          .select('wallet_balance, tasks_completed, total_earnings')
          .eq('user_id', task.doer_id)
          .single();

        if (doerProfile) {
          const balanceBefore = doerProfile.wallet_balance || 0;
          const balanceAfter = balanceBefore + doerPayout;

          await serviceClient
            .from('profiles')
            .update({
              wallet_balance: balanceAfter,
              tasks_completed: (doerProfile.tasks_completed || 0) + 1,
              total_earnings: (doerProfile.total_earnings || 0) + doerPayout
            })
            .eq('user_id', task.doer_id);

          await serviceClient.from('wallet_events').insert({
            user_id: task.doer_id,
            event_type: 'dispute_resolution',
            amount: doerPayout,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            task_id: task.id,
            escrow_id: escrow.id,
            actor_id: adminId,
            metadata: { resolution_type, dispute_id: disputeId }
          });
        }
      }

      // 5. Credit poster refund if applicable
      if (posterRefund > 0) {
        const { data: posterProfile } = await serviceClient
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', task.poster_id)
          .single();

        if (posterProfile) {
          const balanceBefore = posterProfile.wallet_balance || 0;
          const balanceAfter = balanceBefore + posterRefund;

          await serviceClient
            .from('profiles')
            .update({ wallet_balance: balanceAfter })
            .eq('user_id', task.poster_id);

          await serviceClient.from('wallet_events').insert({
            user_id: task.poster_id,
            event_type: 'dispute_refund',
            amount: posterRefund,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            task_id: task.id,
            escrow_id: escrow.id,
            actor_id: adminId,
            metadata: { resolution_type, dispute_id: disputeId }
          });
        }
      }

      // 6. Log admin action
      await serviceClient.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'dispute_resolution',
        target_type: 'dispute',
        target_id: disputeId,
        reason: resolution_notes,
        old_value: { status: 'open' },
        new_value: { 
          status: 'resolved', 
          resolution_type, 
          poster_refund: posterRefund, 
          doer_payout: doerPayout 
        }
      });

      // 7. Log task event
      await serviceClient.from('task_events').insert({
        task_id: task.id,
        actor_id: adminId,
        actor_role: 'admin',
        event_type: 'dispute_resolved',
        old_state: 'disputed',
        new_state: 'completed',
        metadata: { 
          resolution_type, 
          poster_refund: posterRefund, 
          doer_payout: doerPayout,
          dispute_id: disputeId
        }
      });

      // 8. Notify parties
      await serviceClient.from('notification_events').insert([
        {
          user_id: task.doer_id,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          payload: { 
            task_id: task.id, 
            resolution_type, 
            amount: doerPayout,
            message: resolution_notes 
          }
        },
        {
          user_id: task.poster_id,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          payload: { 
            task_id: task.id, 
            resolution_type, 
            refund: posterRefund,
            message: resolution_notes 
          }
        }
      ]);

      return new Response(JSON.stringify({ 
        success: true,
        resolution_type,
        poster_refund: posterRefund,
        doer_payout: doerPayout
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/admin/tasks/:id/force-state - Force task state change
    if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'tasks' && pathParts[3] === 'force-state') {
      const taskId = pathParts[2];
      const body = await req.json();
      const { new_state, reason } = body;

      if (!new_state || !reason) {
        return new Response(JSON.stringify({ error: 'new_state and reason required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const validStates = ['open', 'accepted', 'in_progress', 'submitted', 'approved', 'disputed', 'completed', 'cancelled'];
      if (!validStates.includes(new_state)) {
        return new Response(JSON.stringify({ error: 'Invalid state' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

      const oldState = task.status;

      // Update task
      await serviceClient
        .from('tasks')
        .update({ status: new_state })
        .eq('id', taskId);

      // Log admin action
      await serviceClient.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'force_task_state',
        target_type: 'task',
        target_id: taskId,
        reason,
        old_value: { status: oldState },
        new_value: { status: new_state }
      });

      // Log task event
      await serviceClient.from('task_events').insert({
        task_id: taskId,
        actor_id: adminId,
        actor_role: 'admin',
        event_type: 'admin_force_state',
        old_state: oldState,
        new_state: new_state,
        metadata: { reason }
      });

      return new Response(JSON.stringify({ 
        success: true,
        old_state: oldState,
        new_state
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/admin/users/:id/freeze - Freeze user account
    if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'users' && pathParts[3] === 'freeze') {
      const targetUserId = pathParts[2];
      const body = await req.json();
      const { reason } = body;

      if (!reason) {
        return new Response(JSON.stringify({ error: 'Reason required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if already frozen
      const { data: existingFreeze } = await serviceClient
        .from('user_freezes')
        .select('id')
        .eq('user_id', targetUserId)
        .is('unfrozen_at', null)
        .single();

      if (existingFreeze) {
        return new Response(JSON.stringify({ error: 'User already frozen' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await serviceClient.from('user_freezes').insert({
        user_id: targetUserId,
        frozen_by: adminId,
        reason
      });

      await serviceClient.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'freeze_user',
        target_type: 'user',
        target_id: targetUserId,
        reason,
        old_value: { frozen: false },
        new_value: { frozen: true }
      });

      await serviceClient.from('notification_events').insert({
        user_id: targetUserId,
        type: 'account_frozen',
        title: 'Account Frozen',
        payload: { reason }
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/admin/users/:id/unfreeze - Unfreeze user account
    if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'users' && pathParts[3] === 'unfreeze') {
      const targetUserId = pathParts[2];

      await serviceClient
        .from('user_freezes')
        .update({
          unfrozen_at: new Date().toISOString(),
          unfrozen_by: adminId
        })
        .eq('user_id', targetUserId)
        .is('unfrozen_at', null);

      await serviceClient.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'unfreeze_user',
        target_type: 'user',
        target_id: targetUserId,
        old_value: { frozen: true },
        new_value: { frozen: false }
      });

      await serviceClient.from('notification_events').insert({
        user_id: targetUserId,
        type: 'account_unfrozen',
        title: 'Account Unfrozen',
        payload: {}
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/admin/audit/task/:id - Get complete task audit trail
    if (req.method === 'GET' && pathParts.length === 4 && pathParts[1] === 'audit' && pathParts[2] === 'task') {
      const taskId = pathParts[3];

      const { data: task } = await serviceClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      const { data: events } = await serviceClient
        .from('task_events')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      const { data: walletEvents } = await serviceClient
        .from('wallet_events')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      const { data: escrow } = await serviceClient
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', taskId)
        .single();

      const { data: submissions } = await serviceClient
        .from('submissions')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      const { data: disputes } = await serviceClient
        .from('disputes')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      return new Response(JSON.stringify({ 
        task,
        escrow,
        submissions,
        disputes,
        task_events: events,
        wallet_events: walletEvents
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /v1/admin/failed-jobs - List failed jobs
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'failed-jobs') {
      const pending = url.searchParams.get('pending') === 'true';

      let query = serviceClient
        .from('failed_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (pending) {
        query = query.is('completed_at', null).lt('attempts', 5);
      }

      const { data: jobs, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ jobs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/admin/wallet/credit - Manually credit wallet
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[1] === 'wallet' && pathParts[2] === 'credit') {
      const body = await req.json();
      const { user_id, amount, reason } = body;

      if (!user_id || !amount || !reason) {
        return new Response(JSON.stringify({ error: 'user_id, amount, and reason required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user_id)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const balanceBefore = profile.wallet_balance || 0;
      const balanceAfter = balanceBefore + amount;

      await serviceClient
        .from('profiles')
        .update({ wallet_balance: balanceAfter })
        .eq('user_id', user_id);

      await serviceClient.from('wallet_events').insert({
        user_id,
        event_type: 'admin_credit',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        actor_id: adminId,
        metadata: { reason }
      });

      await serviceClient.from('admin_actions').insert({
        admin_id: adminId,
        action_type: 'wallet_credit',
        target_type: 'user',
        target_id: user_id,
        reason,
        old_value: { balance: balanceBefore },
        new_value: { balance: balanceAfter, credited: amount }
      });

      return new Response(JSON.stringify({ 
        success: true,
        new_balance: balanceAfter
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
