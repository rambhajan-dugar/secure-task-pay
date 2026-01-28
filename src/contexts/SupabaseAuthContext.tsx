import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth, AuthState, AppRole, Profile } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: AppRole,
    preferredLanguage?: string
  ) => Promise<{ user: User | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
  signOut: () => Promise<void>;
  switchRole: (newRole: AppRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Re-export types
export type { AuthState, AppRole, Profile };
