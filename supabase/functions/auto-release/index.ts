import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function should be called by a cron job every 10 minutes
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for background job
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();

    // Find tasks with status = 'submitted' where auto_release_at has passed
    const { data: tasksToRelease, error: fetchError } = await supabase
      .from('tasks')
      .select(`
        id,
        doer_id,
        auto_release_at,
        reward_amount
      `)
      .eq('status', 'submitted')
      .not('auto_release_at', 'is', null)
      .lt('auto_release_at', now);

    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tasksToRelease || tasksToRelease.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No tasks to auto-release',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    for (const task of tasksToRelease) {
      try {
        // Get escrow transaction
        const { data: escrow, error: escrowError } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('task_id', task.id)
          .single();

        if (escrowError || !escrow) {
          results.push({ task_id: task.id, status: 'error', message: 'Escrow not found' });
          continue;
        }

        // Skip if already released
        if (escrow.status === 'released') {
          results.push({ task_id: task.id, status: 'skipped', message: 'Already released' });
          continue;
        }

        // Credit doer wallet
        const { data: doerProfile } = await supabase
          .from('profiles')
          .select('wallet_balance, tasks_completed, total_earnings')
          .eq('user_id', task.doer_id)
          .single();

        if (doerProfile) {
          await supabase
            .from('profiles')
            .update({
              wallet_balance: (doerProfile.wallet_balance || 0) + escrow.net_payout,
              tasks_completed: (doerProfile.tasks_completed || 0) + 1,
              total_earnings: (doerProfile.total_earnings || 0) + escrow.net_payout,
            })
            .eq('user_id', task.doer_id);
        }

        // Update task status to completed (auto-released)
        await supabase
          .from('tasks')
          .update({
            status: 'completed',
            approved_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        // Update escrow status
        await supabase
          .from('escrow_transactions')
          .update({
            status: 'released',
            released_at: new Date().toISOString(),
          })
          .eq('id', escrow.id);

        results.push({ 
          task_id: task.id, 
          status: 'released',
          amount: escrow.net_payout,
          doer_id: task.doer_id,
        });

        console.log(`Auto-released task ${task.id} - ₹${escrow.net_payout} to doer ${task.doer_id}`);

      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        results.push({ task_id: task.id, status: 'error', message: String(taskError) });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: tasksToRelease.length,
      results,
      timestamp: now,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auto-release error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
