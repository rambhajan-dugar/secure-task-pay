/**
 * Production API Client for kaam.com
 * - All calls go through /v1 edge functions
 * - Automatic idempotency key injection for mutations
 * - Structured error handling with typed error codes
 */

import { supabase } from '@/integrations/supabase/client';

// Error codes returned by backend
export type ApiErrorCode = 
  | 'RATE_LIMITED'
  | 'USER_FROZEN'
  | 'INVALID_STATE'
  | 'DUPLICATE_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export class ApiException extends Error {
  code: ApiErrorCode;
  details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ApiException';
  }
}

// Generate idempotency key for mutations
function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

// Map HTTP status to error code
function mapStatusToCode(status: number, errorMessage?: string): ApiErrorCode {
  if (errorMessage?.includes('frozen')) return 'USER_FROZEN';
  if (errorMessage?.includes('rate limit') || errorMessage?.includes('Rate limit')) return 'RATE_LIMITED';
  if (errorMessage?.includes('Idempotency')) return 'DUPLICATE_REQUEST';
  if (errorMessage?.includes('Invalid state') || errorMessage?.includes('transition')) return 'INVALID_STATE';
  
  switch (status) {
    case 401: return 'UNAUTHORIZED';
    case 403: return 'USER_FROZEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'DUPLICATE_REQUEST';
    case 429: return 'RATE_LIMITED';
    default: return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
  idempotent?: boolean; // If true, generates idempotency key
}

/**
 * Core API call function - all frontend requests go through here
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, idempotent = false } = options;

  // Get auth session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ApiException('UNAUTHORIZED', 'Not authenticated');
  }

  // Build URL
  let url = `${SUPABASE_URL}/functions/v1/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  // Add idempotency key for mutations
  if (idempotent && method !== 'GET') {
    headers['x-idempotency-key'] = generateIdempotencyKey();
  }

  // Make request
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const code = mapStatusToCode(response.status, data.error);
    throw new ApiException(code, data.error || 'Request failed', data);
  }

  return data as T;
}

// ============================================
// TASK API
// ============================================

export interface TaskCreatePayload {
  title: string;
  description: string;
  category?: string;
  reward_amount: number;
  deadline: string;
  is_in_person?: boolean;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
}

export const taskApi = {
  create: (data: TaskCreatePayload) =>
    apiCall('v1-tasks', { method: 'POST', body: data, idempotent: true }),

  list: (params?: { status?: string; role?: 'poster' | 'doer'; category?: string }) =>
    apiCall<{ tasks: unknown[] }>('v1-tasks', { params }),

  get: (taskId: string) =>
    apiCall<{ task: unknown }>(`v1-tasks/${taskId}`),

  accept: (taskId: string) =>
    apiCall(`v1-tasks/${taskId}/accept`, { method: 'POST', idempotent: true }),

  start: (taskId: string) =>
    apiCall(`v1-tasks/${taskId}/start`, { method: 'POST' }),

  submit: (taskId: string, data: { message?: string; attachments?: string[] }) =>
    apiCall(`v1-tasks/${taskId}/submit`, { method: 'POST', body: data, idempotent: true }),

  approve: (taskId: string) =>
    apiCall(`v1-tasks/${taskId}/approve`, { method: 'POST', idempotent: true }),

  dispute: (taskId: string, data: { reason: string; description?: string }) =>
    apiCall(`v1-tasks/${taskId}/dispute`, { method: 'POST', body: data, idempotent: true }),
};

// ============================================
// WALLET API
// ============================================

export interface WalletData {
  wallet_balance: number;
  total_earnings: number;
  tasks_completed: number;
  wallet_events: unknown[];
  recent_transactions: unknown[];
}

export const walletApi = {
  get: () =>
    apiCall<WalletData>('v1-wallet'),

  getEvents: (params?: { limit?: string; offset?: string; type?: string }) =>
    apiCall<{ events: unknown[]; total: number }>('v1-wallet/events', { params }),

  addFunds: (amount: number) =>
    apiCall<{ success: boolean; new_balance: number }>('v1-wallet/add-funds', {
      method: 'POST',
      body: { amount },
      idempotent: true,
    }),

  withdraw: (amount: number) =>
    apiCall<{ success: boolean; new_balance: number }>('v1-wallet/withdraw', {
      method: 'POST',
      body: { amount },
      idempotent: true,
    }),
};

// ============================================
// ESCROW API
// ============================================

export const escrowApi = {
  list: (params?: { role?: 'poster' | 'doer'; status?: string }) =>
    apiCall<{ transactions: unknown[] }>('v1-escrow', { params }),

  get: (escrowId: string) =>
    apiCall<{ escrow: unknown; wallet_events: unknown[] }>(`v1-escrow/${escrowId}`),

  release: (taskId: string) =>
    apiCall('v1-escrow/release', {
      method: 'POST',
      body: { task_id: taskId },
      idempotent: true,
    }),
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  me: () =>
    apiCall<{ 
      profile: unknown; 
      roles: string[]; 
      is_frozen: boolean; 
      freeze_reason?: string;
    }>('v1-auth/me'),

  switchRole: (role: 'task_poster' | 'task_doer') =>
    apiCall<{ success: boolean; active_role: string }>('v1-auth/switch-role', {
      method: 'POST',
      body: { role },
    }),
};
