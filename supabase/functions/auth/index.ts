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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[1];

    // POST /auth/register
    if (req.method === 'POST' && action === 'register') {
      const body = await req.json();
      const { email, password, full_name, role, preferred_language } = body;

      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: 'Email, password, and name are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate role
      const validRoles = ['task_poster', 'task_doer'];
      const userRole = validRoles.includes(role) ? role : 'task_doer';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role: userRole,
            preferred_language: preferred_language || 'en',
          },
          emailRedirectTo: `${req.headers.get('origin') || 'https://kaam.com'}/auth/callback`,
        },
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        user: data.user,
        session: data.session,
      }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /auth/login
    if (req.method === 'POST' && action === 'login') {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user profile and role
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: `Bearer ${data.session?.access_token}` } } }
      );

      const { data: profile } = await authClient
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      const { data: roles } = await authClient
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      return new Response(JSON.stringify({ 
        success: true,
        user: data.user,
        session: data.session,
        profile,
        roles: roles?.map(r => r.role) || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /auth/switch-role
    if (req.method === 'POST' && action === 'switch-role') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: authData, error: authError } = await authClient.auth.getClaims(token);
      if (authError || !authData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const userId = authData.claims.sub as string;
      const body = await req.json();
      const { role } = body;

      const validRoles = ['task_poster', 'task_doer'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Use service role to add new role
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Check if role already exists
      const { data: existingRole } = await serviceClient
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (!existingRole) {
        // Add the new role
        const { error: insertError } = await serviceClient
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
          });

        if (insertError) {
          return new Response(JSON.stringify({ error: 'Failed to add role' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Get all user roles
      const { data: roles } = await serviceClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      return new Response(JSON.stringify({ 
        success: true,
        current_role: role,
        all_roles: roles?.map(r => r.role) || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /auth/me - Get current user info
    if (req.method === 'GET' && action === 'me') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: authData, error: authError } = await authClient.auth.getClaims(token);
      if (authError || !authData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const userId = authData.claims.sub as string;

      const { data: profile } = await authClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: roles } = await authClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      return new Response(JSON.stringify({ 
        user_id: userId,
        email: authData.claims.email,
        profile,
        roles: roles?.map(r => r.role) || [],
      }), {
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
