
-- Add verification status and ID image to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS id_image_url text;

-- Create storage bucket for ID verification images
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-verifications', 'id-verifications', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own ID image
CREATE POLICY "Users can upload own ID image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can view their own ID image
CREATE POLICY "Users can view own ID image"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-verifications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- RLS: Admins can view all ID images (for verification)
-- Already covered by the SELECT policy above

-- Allow admins to update profiles (for verification approval)
CREATE POLICY "Admins can update any profile verification"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
