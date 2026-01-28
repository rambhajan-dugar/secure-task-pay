import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useApi() {
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  }, []);

  const callFunction = useCallback(async <T = unknown>(
    functionName: string,
    path: string = '',
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> => {
    const { method = 'GET', body, params } = options;
    
    let url = `${SUPABASE_URL}/functions/v1/${functionName}${path}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers = await getAuthHeaders();

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data as T;
  }, [getAuthHeaders]);

  // Task API
  const tasks = {
    create: (taskData: {
      title: string;
      description: string;
      category?: string;
      reward_amount: number;
      deadline: string;
      is_in_person?: boolean;
      location_address?: string;
      location_lat?: number;
      location_lng?: number;
    }) => callFunction('tasks', '', { method: 'POST', body: taskData }),

    list: (params?: { status?: string; role?: 'poster' | 'doer'; category?: string }) =>
      callFunction<{ tasks: unknown[] }>('tasks', '', { params }),

    get: (taskId: string) =>
      callFunction<{ task: unknown; escrow: unknown; submissions: unknown[] }>('tasks', `/${taskId}`),

    accept: (taskId: string) =>
      callFunction('tasks', `/${taskId}/accept`, { method: 'POST' }),

    start: (taskId: string) =>
      callFunction('tasks', `/${taskId}/start`, { method: 'POST' }),

    submit: (taskId: string, data: { message?: string; attachments?: string[] }) =>
      callFunction('tasks', `/${taskId}/submit`, { method: 'POST', body: data }),

    approve: (taskId: string) =>
      callFunction('tasks', `/${taskId}/approve`, { method: 'POST' }),

    dispute: (taskId: string, data: { reason: string; description?: string }) =>
      callFunction('tasks', `/${taskId}/dispute`, { method: 'POST', body: data }),
  };

  // Escrow API
  const escrow = {
    list: (params?: { role?: 'poster' | 'doer'; status?: string }) =>
      callFunction<{ transactions: unknown[] }>('escrow', '', { params }),

    get: (escrowId: string) =>
      callFunction('escrow', `/${escrowId}`),

    release: (taskId: string) =>
      callFunction('escrow', '/release', { method: 'POST', body: { task_id: taskId } }),
  };

  // Wallet API
  const wallet = {
    get: () =>
      callFunction<{
        wallet_balance: number;
        total_earnings: number;
        tasks_completed: number;
        recent_transactions: unknown[];
      }>('wallet'),

    addFunds: (amount: number) =>
      callFunction('wallet', '/add-funds', { method: 'POST', body: { amount } }),

    withdraw: (amount: number) =>
      callFunction('wallet', '/withdraw', { method: 'POST', body: { amount } }),
  };

  return {
    callFunction,
    tasks,
    escrow,
    wallet,
  };
}
