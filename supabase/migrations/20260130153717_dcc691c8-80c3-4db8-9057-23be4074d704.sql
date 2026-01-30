-- Fix RLS policies to be more restrictive where possible
-- These tables are written by service role, so we need restrictive policies

-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert failed jobs" ON public.failed_jobs;
DROP POLICY IF EXISTS "System can update failed jobs" ON public.failed_jobs;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_events;
DROP POLICY IF EXISTS "System can insert task events" ON public.task_events;
DROP POLICY IF EXISTS "System can insert wallet events" ON public.wallet_events;

-- 1. Failed jobs - admin only (service role bypasses RLS anyway)
CREATE POLICY "Admins can manage failed jobs"
ON public.failed_jobs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Notification events - users can only see their own, system inserts via service role
CREATE POLICY "Users can insert own notifications"
ON public.notification_events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. Task events - only participants can insert (service role bypasses RLS)
CREATE POLICY "Task participants can insert events"
ON public.task_events FOR INSERT
WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_events.task_id
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
);

-- 4. Wallet events - users can only see their own (service role inserts)
CREATE POLICY "Users can insert own wallet events"
ON public.wallet_events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create submissions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions',
    'submissions',
    false,
    10485760, -- 10MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']::text[]
);

-- Storage policies for submissions bucket
CREATE POLICY "Task doer can upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'submissions' AND
    auth.uid()::text = (storage.foldername(name))[2] AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id::text = (storage.foldername(name))[1]
        AND tasks.doer_id = auth.uid()
        AND tasks.status IN ('in_progress', 'submitted')
    )
);

CREATE POLICY "Task participants can view submissions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'submissions' AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id::text = (storage.foldername(name))[1]
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
);

CREATE POLICY "Admins can view all submissions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'submissions' AND
    has_role(auth.uid(), 'admin'::app_role)
);