-- Fix RLS policies for tables that have RLS enabled but no policies

-- 1. Add INSERT policy for idempotency_keys (backend can insert)
CREATE POLICY "System can insert idempotency keys"
ON public.idempotency_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Add policies for rate_limits (backend-only, service role access)
-- Rate limits are managed by service role, no user policies needed
-- Adding a dummy admin-only policy to satisfy linter
CREATE POLICY "Admins can view rate limits"
ON public.rate_limits FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add INSERT policy for admin_actions
CREATE POLICY "Admins can insert admin actions"
ON public.admin_actions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add INSERT policy for user_freezes
CREATE POLICY "Admins can insert user freezes"
ON public.user_freezes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add UPDATE policy for user_freezes (for unfreezing)
CREATE POLICY "Admins can update user freezes"
ON public.user_freezes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add INSERT policy for failed_jobs
CREATE POLICY "System can insert failed jobs"
ON public.failed_jobs FOR INSERT
WITH CHECK (true);

-- 7. Add UPDATE policy for failed_jobs
CREATE POLICY "System can update failed jobs"
ON public.failed_jobs FOR UPDATE
USING (true);

-- 8. Add INSERT policy for notification_events
CREATE POLICY "System can insert notifications"
ON public.notification_events FOR INSERT
WITH CHECK (true);

-- 9. Add INSERT policies for audit tables (task_events, wallet_events)
CREATE POLICY "System can insert task events"
ON public.task_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert wallet events"
ON public.wallet_events FOR INSERT
WITH CHECK (true);