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
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();
    console.log(`[AUTO-RELEASE] Starting job at ${now}`);

    // Find tasks ready for auto-release
    const { data: tasksToRelease, error: fetchError } = await serviceClient
      .from('tasks')
      .select('id, doer_id, poster_id, auto_release_at, reward_amount, status')
      .eq('status', 'submitted')
      .not('auto_release_at', 'is', null)
      .lt('auto_release_at', now);

    if (fetchError) {
      console.error('[AUTO-RELEASE] Error fetching tasks:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tasksToRelease || tasksToRelease.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No tasks to auto-release', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[AUTO-RELEASE] Found ${tasksToRelease.length} tasks to process`);
    const results = [];

    for (const task of tasksToRelease) {
      try {
        // Get escrow
        const { data: escrow } = await serviceClient
          .from('escrow_transactions')
          .select('*')
          .eq('task_id', task.id)
          .single();

        if (!escrow || escrow.status === 'released') {
          results.push({ task_id: task.id, status: 'skipped', message: 'Already released or no escrow' });
          continue;
        }

        // Get doer profile
        const { data: doerProfile } = await serviceClient
          .from('profiles')
          .select('wallet_balance, tasks_completed, total_earnings')
          .eq('user_id', task.doer_id)
          .single();

        if (!doerProfile) {
          results.push({ task_id: task.id, status: 'error', message: 'Doer profile not found' });
          continue;
        }

        const balanceBefore = doerProfile.wallet_balance || 0;
        const balanceAfter = balanceBefore + escrow.net_payout;

        // ATOMIC: Update escrow, task, wallet
        await serviceClient.from('escrow_transactions').update({ status: 'released', released_at: now }).eq('id', escrow.id);
        await serviceClient.from('tasks').update({ status: 'completed', approved_at: now }).eq('id', task.id);
        await serviceClient.from('profiles').update({
          wallet_balance: balanceAfter,
          tasks_completed: (doerProfile.tasks_completed || 0) + 1,
          total_earnings: (doerProfile.total_earnings || 0) + escrow.net_payout
        }).eq('user_id', task.doer_id);

        // Log events
        await serviceClient.from('wallet_events').insert({
          user_id: task.doer_id, event_type: 'auto_release', amount: escrow.net_payout,
          balance_before: balanceBefore, balance_after: balanceAfter, task_id: task.id, escrow_id: escrow.id
        });

        await serviceClient.from('task_events').insert({
          task_id: task.id, actor_id: task.doer_id, actor_role: 'system',
          event_type: 'auto_released', old_state: 'submitted', new_state: 'completed'
        });

        await serviceClient.from('notification_events').insert([
          { user_id: task.doer_id, type: 'payment_auto_released', title: 'Payment Auto-Released!', payload: { task_id: task.id, amount: escrow.net_payout } },
          { user_id: task.poster_id, type: 'task_auto_completed', title: 'Task Auto-Completed', payload: { task_id: task.id } }
        ]);

        results.push({ task_id: task.id, status: 'released', amount: escrow.net_payout });
        console.log(`[AUTO-RELEASE] Released ₹${escrow.net_payout} for task ${task.id}`);

      } catch (taskError) {
        console.error(`[AUTO-RELEASE] Error processing task ${task.id}:`, taskError);
        results.push({ task_id: task.id, status: 'error', message: String(taskError) });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: tasksToRelease.length, results, timestamp: now }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AUTO-RELEASE] Fatal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
