
-- Drop the overly permissive INSERT policy on user_roles
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Create a restrictive policy: users can only self-assign task_poster or task_doer
CREATE POLICY "Users can insert own non-privileged roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('task_poster'::app_role, 'task_doer'::app_role)
);
