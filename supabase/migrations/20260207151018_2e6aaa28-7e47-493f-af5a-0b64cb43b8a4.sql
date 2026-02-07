-- ============================================
-- FEATURE 1: IN-APP CHAT TABLES
-- ============================================

-- Messages table for Captain <-> Ace communication
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT false,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flagged_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat events for delivery tracking
CREATE TABLE public.chat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'read', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_events ENABLE ROW LEVEL SECURITY;

-- RLS: Only task participants (poster + assigned doer) can read messages
CREATE POLICY "Task participants can view messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = messages.task_id
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
);

-- RLS: Only task participants can send messages (and only when task is active)
CREATE POLICY "Task participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
        AND tasks.status IN ('accepted', 'in_progress', 'submitted', 'under_review')
    )
);

-- RLS: Users can flag messages they receive
CREATE POLICY "Users can flag received messages"
ON public.messages FOR UPDATE
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- RLS: Chat events - participants can view
CREATE POLICY "Task participants can view chat events"
ON public.chat_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.tasks t ON t.id = m.task_id
        WHERE m.id = chat_events.message_id
        AND (t.poster_id = auth.uid() OR t.doer_id = auth.uid())
    )
);

-- RLS: Users can insert chat events for messages they're involved in
CREATE POLICY "Users can insert chat events"
ON public.chat_events FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.tasks t ON t.id = m.task_id
        WHERE m.id = message_id
        AND (t.poster_id = auth.uid() OR t.doer_id = auth.uid())
    )
);

-- ============================================
-- FEATURE 2: IMAGE VERIFICATION TABLES
-- ============================================

-- Task verification images
CREATE TABLE public.task_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
    image_path TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT NULL,
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '28 days')
);

-- Enable RLS
ALTER TABLE public.task_verifications ENABLE ROW LEVEL SECURITY;

-- RLS: Task participants can view verifications
CREATE POLICY "Task participants can view verifications"
ON public.task_verifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_verifications.task_id
        AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin')
);

-- RLS: Only assigned doer can upload verification images
CREATE POLICY "Doer can upload verification images"
ON public.task_verifications FOR INSERT
WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id
        AND tasks.doer_id = auth.uid()
        AND tasks.status IN ('accepted', 'in_progress', 'submitted')
    )
);

-- RLS: Captain can approve/reject, admin can override
CREATE POLICY "Captain or admin can review verifications"
ON public.task_verifications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_verifications.task_id
        AND tasks.poster_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- FEATURE 3: MODERATION EVENTS TABLE
-- ============================================

-- Moderation events for admin audit trail
CREATE TABLE public.moderation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'message', 'verification', 'task')),
    target_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'mute_chat', 'freeze_account', 'unfreeze_account', 'approve_override', 'reject_override', 'dismiss_flag')),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view moderation events
CREATE POLICY "Admins can view moderation events"
ON public.moderation_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS: Only admins can create moderation events
CREATE POLICY "Admins can create moderation events"
ON public.moderation_events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_messages_task_id ON public.messages(task_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_is_flagged ON public.messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_chat_events_message_id ON public.chat_events(message_id);
CREATE INDEX idx_task_verifications_task_id ON public.task_verifications(task_id);
CREATE INDEX idx_task_verifications_is_approved ON public.task_verifications(is_approved);
CREATE INDEX idx_moderation_events_admin_id ON public.moderation_events(admin_id);
CREATE INDEX idx_moderation_events_target ON public.moderation_events(target_type, target_id);

-- ============================================
-- ENABLE REALTIME FOR CHAT
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_events;

-- ============================================
-- STORAGE BUCKET FOR VERIFICATION IMAGES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-verifications',
    'task-verifications',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for verification images
CREATE POLICY "Doer can upload verification images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Task participants can view verification images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'task-verifications'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR has_role(auth.uid(), 'admin')
        OR EXISTS (
            SELECT 1 FROM public.task_verifications tv
            JOIN public.tasks t ON t.id = tv.task_id
            WHERE tv.image_path LIKE '%' || name
            AND (t.poster_id = auth.uid() OR t.doer_id = auth.uid())
        )
    )
);