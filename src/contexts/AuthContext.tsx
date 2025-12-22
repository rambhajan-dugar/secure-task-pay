import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('kaam_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, find user or create new one
    let foundUser = mockUsers.find(u => u.email === email && u.role === role);
    
    if (!foundUser) {
      foundUser = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        tasksCompleted: role === 'task_doer' ? Math.floor(Math.random() * 50) : 0,
        rating: 4.5 + Math.random() * 0.5,
        totalEarnings: role === 'task_doer' ? Math.floor(Math.random() * 100000) : 0,
        createdAt: new Date(),
      };
    }
    
    setUser(foundUser);
    localStorage.setItem('kaam_user', JSON.stringify(foundUser));
    return true;
  };

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role,
      tasksCompleted: 0,
      rating: 0,
      totalEarnings: 0,
      createdAt: new Date(),
    };
    
    setUser(newUser);
    localStorage.setItem('kaam_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaam_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('kaam_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
