-- =====================================================
-- PRODUCTION-GRADE BACKEND HARDENING SCHEMA
-- =====================================================

-- 1. IDEMPOTENCY KEYS TABLE
CREATE TABLE public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(key, user_id)
);

CREATE INDEX idx_idempotency_keys_lookup ON public.idempotency_keys(key, user_id);
CREATE INDEX idx_idempotency_keys_created ON public.idempotency_keys(created_at);

-- Auto-cleanup old keys (older than 24 hours)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own idempotency keys"
ON public.idempotency_keys FOR SELECT
USING (auth.uid() = user_id);

-- 2. TASK EVENTS TABLE (AUDIT LOG)
CREATE TABLE public.task_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    event_type TEXT NOT NULL,
    old_state TEXT,
    new_state TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_events_task ON public.task_events(task_id);
CREATE INDEX idx_task_events_actor ON public.task_events(actor_id);
CREATE INDEX idx_task_events_type ON public.task_events(event_type);
CREATE INDEX idx_task_events_created ON public.task_events(created_at);

ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task participants can view events"
ON public.task_events FOR SELECT
USING (
    actor_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_events.task_id
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
);

-- 3. WALLET EVENTS TABLE (FINANCIAL AUDIT)
CREATE TABLE public.wallet_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    task_id UUID REFERENCES public.tasks(id),
    escrow_id UUID REFERENCES public.escrow_transactions(id),
    actor_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_events_user ON public.wallet_events(user_id);
CREATE INDEX idx_wallet_events_task ON public.wallet_events(task_id);
CREATE INDEX idx_wallet_events_type ON public.wallet_events(event_type);
CREATE INDEX idx_wallet_events_created ON public.wallet_events(created_at);

ALTER TABLE public.wallet_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet events"
ON public.wallet_events FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 4. NOTIFICATION EVENTS TABLE
CREATE TABLE public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_events_user ON public.notification_events(user_id);
CREATE INDEX idx_notification_events_type ON public.notification_events(type);
CREATE INDEX idx_notification_events_unread ON public.notification_events(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notification_events FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notification_events FOR UPDATE
USING (user_id = auth.uid());

-- 5. FAILED JOBS TABLE (RETRY QUEUE)
CREATE TABLE public.failed_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_failed_jobs_pending ON public.failed_jobs(job_type, next_retry_at) 
WHERE completed_at IS NULL AND attempts < max_attempts;

ALTER TABLE public.failed_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view failed jobs"
ON public.failed_jobs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. RATE LIMITS TABLE
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No user access to rate limits - backend only

-- 7. ADMIN ACTIONS LOG TABLE
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_type ON public.admin_actions(action_type);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin actions"
ON public.admin_actions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. USER FREEZES TABLE
CREATE TABLE public.user_freezes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    frozen_by UUID NOT NULL,
    reason TEXT NOT NULL,
    frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    unfrozen_at TIMESTAMP WITH TIME ZONE,
    unfrozen_by UUID
);

CREATE INDEX idx_user_freezes_user ON public.user_freezes(user_id);
CREATE INDEX idx_user_freezes_active ON public.user_freezes(user_id) WHERE unfrozen_at IS NULL;

ALTER TABLE public.user_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own freeze status"
ON public.user_freezes FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 9. DISPUTE RESOLUTION UPDATES
ALTER TABLE public.disputes 
ADD COLUMN IF NOT EXISTS resolution_type TEXT,
ADD COLUMN IF NOT EXISTS poster_refund_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS doer_payout_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolved_by UUID;

-- 10. HELPER FUNCTION: Check if user is frozen
CREATE OR REPLACE FUNCTION public.is_user_frozen(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_freezes
        WHERE user_id = _user_id
        AND unfrozen_at IS NULL
    )
$$;

-- 11. HELPER FUNCTION: Log task event
CREATE OR REPLACE FUNCTION public.log_task_event(
    _task_id UUID,
    _actor_id UUID,
    _actor_role TEXT,
    _event_type TEXT,
    _old_state TEXT,
    _new_state TEXT,
    _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.task_events (task_id, actor_id, actor_role, event_type, old_state, new_state, metadata)
    VALUES (_task_id, _actor_id, _actor_role, _event_type, _old_state, _new_state, _metadata)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- 12. HELPER FUNCTION: Log wallet event
CREATE OR REPLACE FUNCTION public.log_wallet_event(
    _user_id UUID,
    _event_type TEXT,
    _amount BIGINT,
    _balance_before BIGINT,
    _balance_after BIGINT,
    _task_id UUID DEFAULT NULL,
    _escrow_id UUID DEFAULT NULL,
    _actor_id UUID DEFAULT NULL,
    _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.wallet_events (user_id, event_type, amount, balance_before, balance_after, task_id, escrow_id, actor_id, metadata)
    VALUES (_user_id, _event_type, _amount, _balance_before, _balance_after, _task_id, _escrow_id, _actor_id, _metadata)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- 13. HELPER FUNCTION: Create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    _user_id UUID,
    _type TEXT,
    _title TEXT,
    _payload JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notification_events (user_id, type, title, payload)
    VALUES (_user_id, _type, _title, _payload)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 14. TRIGGER: Update updated_at on failed_jobs
CREATE TRIGGER update_failed_jobs_updated_at
BEFORE UPDATE ON public.failed_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();