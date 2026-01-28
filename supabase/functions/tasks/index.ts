import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_FEE_PERCENT = 12.5;

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  'open': ['accepted', 'cancelled'],
  'accepted': ['in_progress', 'cancelled'],
  'in_progress': ['submitted', 'cancelled'],
  'submitted': ['approved', 'disputed', 'completed'], // completed = auto_released
  'approved': ['completed'],
  'disputed': ['approved', 'cancelled'],
  'completed': [],
  'cancelled': [],
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
    
    // POST /tasks - Create a new task
    if (req.method === 'POST' && pathParts.length === 1) {
      const body = await req.json();
      const { title, description, category, reward_amount, deadline, is_in_person, location_address, location_lat, location_lng } = body;

      if (!title || !description || !reward_amount || !deadline) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Calculate fee (for reference, actual deduction happens on release)
      const platformFee = Math.round((reward_amount * PLATFORM_FEE_PERCENT) / 100);
      const taskDoerAmount = reward_amount - platformFee;

      const { data: task, error: taskError } = await supabase
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
          location_lng,
        })
        .select()
        .single();

      if (taskError) {
        return new Response(JSON.stringify({ error: taskError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create escrow entry with status HELD (pending)
      const { error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert({
          task_id: task.id,
          poster_id: userId,
          gross_amount: reward_amount,
          platform_fee: platformFee,
          fee_percentage: PLATFORM_FEE_PERCENT,
          net_payout: taskDoerAmount,
          status: 'pending', // HELD state
        });

      if (escrowError) {
        // Rollback task creation
        await supabase.from('tasks').delete().eq('id', task.id);
        return new Response(JSON.stringify({ error: 'Failed to create escrow' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        task,
        fee_breakdown: {
          gross_amount: reward_amount,
          platform_fee: platformFee,
          platform_fee_percent: PLATFORM_FEE_PERCENT,
          net_payout: taskDoerAmount,
        }
      }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /tasks - List tasks
    if (req.method === 'GET' && pathParts.length === 1) {
      const status = url.searchParams.get('status');
      const role = url.searchParams.get('role'); // 'poster' or 'doer'
      const category = url.searchParams.get('category');

      let query = supabase.from('tasks').select('*');

      if (status) {
        query = query.eq('status', status);
      }
      if (role === 'poster') {
        query = query.eq('poster_id', userId);
      } else if (role === 'doer') {
        query = query.eq('doer_id', userId);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data: tasks, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /tasks/:id - Get single task
    if (req.method === 'GET' && pathParts.length === 2) {
      const taskId = pathParts[1];
      
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (error || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get escrow info
      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      // Get submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      return new Response(JSON.stringify({ task, escrow, submissions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /tasks/:id/accept - Accept a task
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'accept') {
      const taskId = pathParts[1];

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate: Cannot accept own task
      if (task.poster_id === userId) {
        return new Response(JSON.stringify({ error: 'Cannot accept your own task' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate status transition
      if (!validTransitions[task.status]?.includes('accepted')) {
        return new Response(JSON.stringify({ error: `Cannot accept task in ${task.status} status` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'accepted',
          doer_id: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update escrow with doer_id and status to in_escrow
      await supabase
        .from('escrow_transactions')
        .update({
          doer_id: userId,
          status: 'in_escrow',
        })
        .eq('task_id', taskId);

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /tasks/:id/start - Start working on task
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'start') {
      const taskId = pathParts[1];

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only doer can start
      if (task.doer_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only the assigned doer can start this task' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!validTransitions[task.status]?.includes('in_progress')) {
        return new Response(JSON.stringify({ error: `Cannot start task in ${task.status} status` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, task: updatedTask }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /tasks/:id/submit - Submit completed work
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'submit') {
      const taskId = pathParts[1];
      const body = await req.json();
      const { message, attachments } = body;

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only doer can submit
      if (task.doer_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only the assigned doer can submit' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!validTransitions[task.status]?.includes('submitted')) {
        return new Response(JSON.stringify({ error: `Cannot submit task in ${task.status} status` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create submission record
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          task_id: taskId,
          submitted_by: userId,
          message,
          attachments,
        });

      if (submissionError) {
        return new Response(JSON.stringify({ error: 'Failed to create submission' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Set auto-release time (24 hours from now)
      const autoReleaseAt = new Date();
      autoReleaseAt.setHours(autoReleaseAt.getHours() + 24);

      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          auto_release_at: autoReleaseAt.toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update escrow auto_release_at
      await supabase
        .from('escrow_transactions')
        .update({ auto_release_at: autoReleaseAt.toISOString() })
        .eq('task_id', taskId);

      return new Response(JSON.stringify({ 
        success: true, 
        task: updatedTask,
        auto_release_at: autoReleaseAt.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /tasks/:id/approve - Approve submission and release payment
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'approve') {
      const taskId = pathParts[1];

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only poster can approve
      if (task.poster_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only the task poster can approve' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!validTransitions[task.status]?.includes('approved')) {
        return new Response(JSON.stringify({ error: `Cannot approve task in ${task.status} status` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('task_id', taskId)
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
      const { error: walletError } = await serviceClient
        .from('profiles')
        .update({ 
          wallet_balance: serviceClient.rpc('increment_wallet', { 
            user_id: task.doer_id, 
            amount: escrow.net_payout 
          })
        })
        .eq('user_id', task.doer_id);

      // Update wallet balance using RPC or direct update
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

      // Update task status
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Mark escrow as released
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('task_id', taskId);

      return new Response(JSON.stringify({ 
        success: true, 
        task: updatedTask,
        payment: {
          released: true,
          amount: escrow.net_payout,
          platform_fee: escrow.platform_fee,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /tasks/:id/dispute - Raise a dispute
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'dispute') {
      const taskId = pathParts[1];
      const body = await req.json();
      const { reason, description } = body;

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only participants can dispute
      if (task.poster_id !== userId && task.doer_id !== userId) {
        return new Response(JSON.stringify({ error: 'Only task participants can raise a dispute' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!validTransitions[task.status]?.includes('disputed')) {
        return new Response(JSON.stringify({ error: `Cannot dispute task in ${task.status} status` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('id')
        .eq('task_id', taskId)
        .single();

      const raisedByRole = task.poster_id === userId ? 'poster' : 'doer';

      // Create dispute record
      const { data: dispute, error: disputeError } = await supabase
        .from('disputes')
        .insert({
          task_id: taskId,
          escrow_id: escrow?.id,
          raised_by_id: userId,
          raised_by_role: raisedByRole,
          reason: reason || 'Not specified',
          description,
          status: 'open',
        })
        .select()
        .single();

      if (disputeError) {
        return new Response(JSON.stringify({ error: 'Failed to create dispute' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update task and escrow status
      await supabase
        .from('tasks')
        .update({ status: 'disputed' })
        .eq('id', taskId);

      await supabase
        .from('escrow_transactions')
        .update({ status: 'disputed' })
        .eq('task_id', taskId);

      return new Response(JSON.stringify({ success: true, dispute }), {
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
