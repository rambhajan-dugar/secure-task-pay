/**
 * useApi hook - Wrapper around the production API client
 * Provides React-friendly interface with loading states
 */

import { useCallback, useState } from 'react';
import { 
  taskApi, 
  walletApi, 
  escrowApi, 
  authApi,
  ApiException,
  type ApiErrorCode,
  type TaskCreatePayload,
  type WalletData,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface UseApiState {
  isLoading: boolean;
  error: ApiErrorCode | null;
}

// Error messages for user-friendly display
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  USER_FROZEN: 'Your account has been frozen. Contact support.',
  INVALID_STATE: 'This action is not allowed in the current state.',
  DUPLICATE_REQUEST: 'This request was already processed.',
  UNAUTHORIZED: 'Please log in to continue.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

export function useApi() {
  const [state, setState] = useState<UseApiState>({
    isLoading: false,
    error: null,
  });

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiException) {
      setState(prev => ({ ...prev, error: error.code }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: ERROR_MESSAGES[error.code] || error.message,
      });
      return error.code;
    }
    setState(prev => ({ ...prev, error: 'INTERNAL_ERROR' }));
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'An unexpected error occurred.',
    });
    return 'INTERNAL_ERROR' as ApiErrorCode;
  }, []);

  const wrapCall = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await fn();
      setState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      handleError(error);
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [handleError]);

  // Task operations
  const tasks = {
    create: (data: TaskCreatePayload) => wrapCall(() => taskApi.create(data)),
    list: (params?: { status?: string; role?: 'poster' | 'doer'; category?: string }) => 
      wrapCall(() => taskApi.list(params)),
    get: (taskId: string) => wrapCall(() => taskApi.get(taskId)),
    accept: (taskId: string) => wrapCall(() => taskApi.accept(taskId)),
    start: (taskId: string) => wrapCall(() => taskApi.start(taskId)),
    submit: (taskId: string, data: { message?: string; attachments?: string[] }) => 
      wrapCall(() => taskApi.submit(taskId, data)),
    approve: (taskId: string) => wrapCall(() => taskApi.approve(taskId)),
    dispute: (taskId: string, data: { reason: string; description?: string }) => 
      wrapCall(() => taskApi.dispute(taskId, data)),
  };

  // Wallet operations
  const wallet = {
    get: () => wrapCall(() => walletApi.get()),
    getEvents: (params?: { limit?: string; offset?: string; type?: string }) => 
      wrapCall(() => walletApi.getEvents(params)),
    addFunds: (amount: number) => wrapCall(() => walletApi.addFunds(amount)),
    withdraw: (amount: number) => wrapCall(() => walletApi.withdraw(amount)),
  };

  // Escrow operations
  const escrow = {
    list: (params?: { role?: 'poster' | 'doer'; status?: string }) => 
      wrapCall(() => escrowApi.list(params)),
    get: (escrowId: string) => wrapCall(() => escrowApi.get(escrowId)),
    release: (taskId: string) => wrapCall(() => escrowApi.release(taskId)),
  };

  // Auth operations
  const auth = {
    me: () => wrapCall(() => authApi.me()),
    switchRole: (role: 'task_poster' | 'task_doer') => wrapCall(() => authApi.switchRole(role)),
  };

  return {
    ...state,
    tasks,
    wallet,
    escrow,
    auth,
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
}
