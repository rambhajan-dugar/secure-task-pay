-- =====================================================
-- PRODUCTION HARDENING: CONSTRAINTS + INDEXES
-- =====================================================

-- 1. UNIQUE constraint on idempotency_keys (already added via UNIQUE in original, but ensure)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_user_key_unique'
    ) THEN
        ALTER TABLE public.idempotency_keys 
        ADD CONSTRAINT idempotency_keys_user_key_unique UNIQUE (user_id, key);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 2. CHECK constraint: wallet_balance >= 0
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_wallet_balance_non_negative;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_wallet_balance_non_negative 
CHECK (wallet_balance >= 0);

-- 3. CHECK constraint: escrow amounts positive
ALTER TABLE public.escrow_transactions
DROP CONSTRAINT IF EXISTS escrow_amounts_valid;

ALTER TABLE public.escrow_transactions
ADD CONSTRAINT escrow_amounts_valid
CHECK (gross_amount > 0 AND net_payout >= 0 AND platform_fee >= 0);

-- 4. CHECK constraint: task reward positive
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS task_reward_positive;

ALTER TABLE public.tasks
ADD CONSTRAINT task_reward_positive
CHECK (reward_amount >= 100);

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_task_events_task_created 
ON public.task_events(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_events_user_created 
ON public.wallet_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_retry 
ON public.failed_jobs(next_retry_at) 
WHERE completed_at IS NULL AND attempts < max_attempts;

CREATE INDEX IF NOT EXISTS idx_tasks_status_doer 
ON public.tasks(status, doer_id) WHERE doer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_status_poster 
ON public.tasks(status, poster_id);

CREATE INDEX IF NOT EXISTS idx_escrow_task_status 
ON public.escrow_transactions(task_id, status);

CREATE INDEX IF NOT EXISTS idx_disputes_status 
ON public.disputes(status) WHERE status = 'open';

-- 6. Add version column for optimistic locking on escrow
ALTER TABLE public.escrow_transactions 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 7. Ensure user_freezes has proper unique constraint
DO $$
BEGIN
    -- Drop old unique constraint on user_id if exists (we want to allow multiple freeze records)
    ALTER TABLE public.user_freezes DROP CONSTRAINT IF EXISTS user_freezes_user_id_key;
EXCEPTION WHEN undefined_object THEN
    NULL;
END $$;

-- 8. Add composite index for active freezes lookup
CREATE INDEX IF NOT EXISTS idx_user_freezes_active 
ON public.user_freezes(user_id) WHERE unfrozen_at IS NULL;