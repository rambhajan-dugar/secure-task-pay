// Shared utilities for edge functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export function createAuthClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Hash request body for idempotency check
export async function hashRequest(body: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check and store idempotency key
export async function checkIdempotency(
  serviceClient: SupabaseClient,
  key: string,
  userId: string,
  endpoint: string,
  requestHash: string
): Promise<{ exists: boolean; response?: unknown }> {
  // Check if key exists
  const { data: existing } = await serviceClient
    .from('idempotency_keys')
    .select('*')
    .eq('key', key)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Key exists - check if request hash matches
    if (existing.request_hash !== requestHash) {
      throw new Error('Idempotency key reused with different request');
    }
    return { exists: true, response: existing.response };
  }

  return { exists: false };
}

export async function storeIdempotencyResponse(
  serviceClient: SupabaseClient,
  key: string,
  userId: string,
  endpoint: string,
  requestHash: string,
  response: unknown
): Promise<void> {
  await serviceClient
    .from('idempotency_keys')
    .insert({
      key,
      user_id: userId,
      endpoint,
      request_hash: requestHash,
      response
    });
}

// Rate limiting
export async function checkRateLimit(
  serviceClient: SupabaseClient,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  // Count requests in window
  const { count } = await serviceClient
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString());

  const currentCount = count || 0;

  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Record this request
  await serviceClient
    .from('rate_limits')
    .insert({
      identifier,
      endpoint,
      window_start: new Date().toISOString()
    });

  return { allowed: true, remaining: maxRequests - currentCount - 1 };
}

// Check if user is frozen
export async function isUserFrozen(
  serviceClient: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await serviceClient
    .from('user_freezes')
    .select('id')
    .eq('user_id', userId)
    .is('unfrozen_at', null)
    .single();

  return !!data;
}

// Valid task state transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  'open': ['accepted', 'cancelled'],
  'accepted': ['in_progress', 'cancelled'],
  'in_progress': ['submitted'],
  'submitted': ['approved', 'disputed', 'completed'], // completed = auto-release
  'approved': ['completed'],
  'disputed': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': []
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Platform fee calculation (12.5%)
export const PLATFORM_FEE_PERCENT = 12.5;

export function calculateFees(grossAmount: number): {
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  feePercent: number;
} {
  const platformFee = Math.round(grossAmount * PLATFORM_FEE_PERCENT / 100);
  const netPayout = grossAmount - platformFee;
  return {
    grossAmount,
    platformFee,
    netPayout,
    feePercent: PLATFORM_FEE_PERCENT
  };
}
