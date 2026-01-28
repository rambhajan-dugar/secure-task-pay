-- Add wallet_balance to profiles for sandbox payments
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_balance bigint DEFAULT 0;

-- Create submissions table for task work submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  message text,
  attachments text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for submissions
CREATE POLICY "Task participants can view submissions"
  ON public.submissions FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = submissions.task_id 
      AND (tasks.poster_id = auth.uid() OR tasks.doer_id = auth.uid())
    )
  );

CREATE POLICY "Task doer can create submission"
  ON public.submissions FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = submissions.task_id 
      AND tasks.doer_id = auth.uid()
      AND tasks.status = 'in_progress'
    )
  );

-- Create trigger for updated_at on submissions
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;