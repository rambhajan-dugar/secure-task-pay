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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // POST /v1/auth/register
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'register') {
      const body = await req.json();
      const { email, password, full_name, role, preferred_language } = body;

      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: 'Email, password, and full_name required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const validRoles = ['task_poster', 'task_doer'];
      const selectedRole = validRoles.includes(role) ? role : 'task_doer';

      const { data: authData, error: authError } = await serviceClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role: selectedRole,
            preferred_language: preferred_language || 'en'
          }
        }
      });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        user: authData.user,
        message: 'Registration successful. Please check your email to verify your account.'
      }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/auth/login
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'login') {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user is frozen
      const { data: freezeData } = await serviceClient
        .from('user_freezes')
        .select('reason')
        .eq('user_id', authData.user.id)
        .is('unfrozen_at', null)
        .single();

      if (freezeData) {
        return new Response(JSON.stringify({ 
          error: 'Account is frozen',
          reason: freezeData.reason 
        }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get profile and roles
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      const { data: roles } = await serviceClient
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id);

      return new Response(JSON.stringify({ 
        session: authData.session,
        user: authData.user,
        profile,
        roles: roles?.map(r => r.role) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Authenticated endpoints require auth header
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

    // GET /v1/auth/me - Get current user info
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'me') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const { data: freezeData } = await serviceClient
        .from('user_freezes')
        .select('reason, frozen_at')
        .eq('user_id', userId)
        .is('unfrozen_at', null)
        .single();

      return new Response(JSON.stringify({ 
        profile,
        roles: roles?.map(r => r.role) || [],
        is_frozen: !!freezeData,
        freeze_reason: freezeData?.reason
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/auth/switch-role - Switch active role
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'switch-role') {
      const body = await req.json();
      const { role } = body;

      const validRoles = ['task_poster', 'task_doer'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (!existingRole) {
        // Add the role
        await serviceClient
          .from('user_roles')
          .insert({ user_id: userId, role });
      }

      return new Response(JSON.stringify({ 
        success: true,
        active_role: role 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /v1/auth/logout
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'logout') {
      await supabase.auth.signOut();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
