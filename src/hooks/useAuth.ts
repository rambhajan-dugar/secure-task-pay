import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'task_poster' | 'task_doer' | 'admin' | 'safety_team';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  preferred_language: string;
  rating: number;
  tasks_completed: number;
  total_earnings: number;
  wallet_balance: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  currentRole: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    currentRole: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = (rolesData?.map(r => r.role) || []) as AppRole[];
      
      // Get stored current role or default to first role
      const storedRole = localStorage.getItem('kaam_current_role') as AppRole | null;
      const currentRole = roles.includes(storedRole!) ? storedRole : roles[0] || null;

      return { profile: profile as Profile | null, roles, currentRole };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, roles: [], currentRole: null };
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(session.user.id);
            setState({
              user: session.user,
              session,
              profile: userData.profile,
              roles: userData.roles,
              currentRole: userData.currentRole,
              isLoading: false,
              isAuthenticated: true,
            });
          }, 0);
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            roles: [],
            currentRole: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id).then(userData => {
          setState({
            user: session.user,
            session,
            profile: userData.profile,
            roles: userData.roles,
            currentRole: userData.currentRole,
            isLoading: false,
            isAuthenticated: true,
          });
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: AppRole = 'task_doer',
    preferredLanguage: string = 'en'
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          preferred_language: preferredLanguage,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    
    // Store current role
    localStorage.setItem('kaam_current_role', role);
    
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    localStorage.removeItem('kaam_current_role');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const switchRole = async (newRole: AppRole) => {
    if (!state.user) throw new Error('Not authenticated');

    // Check if user already has this role
    if (!state.roles.includes(newRole)) {
      // Add the role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: state.user.id,
          role: newRole,
        });

      if (error) throw error;
    }

    localStorage.setItem('kaam_current_role', newRole);
    setState(prev => ({
      ...prev,
      currentRole: newRole,
      roles: prev.roles.includes(newRole) ? prev.roles : [...prev.roles, newRole],
    }));
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    const userData = await fetchUserData(state.user.id);
    setState(prev => ({
      ...prev,
      profile: userData.profile,
      roles: userData.roles,
      currentRole: userData.currentRole,
    }));
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    switchRole,
    refreshProfile,
  };
}
