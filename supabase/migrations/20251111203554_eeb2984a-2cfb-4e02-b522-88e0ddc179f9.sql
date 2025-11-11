-- Update RLS policies for user_invites to support legacy client roles in profiles

-- INSERT policy: allow clients (by user_roles or legacy profiles.role) to create invites for their own client_email
DROP POLICY IF EXISTS "Clients can create invites for their collaborators" ON public.user_invites;

CREATE POLICY "Clients can create invites for their collaborators"
ON public.user_invites
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- New model: user_roles table
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('client', 'client_collaborator')
    )
    OR
    -- Legacy model: profiles.role with email context
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('client')
    )
  )
  AND
  -- Ensure the invite targets the authenticated client's own area
  client_email IN (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
  AND
  -- Only allow creating client collaborator invites
  role = 'staff'
);

-- SELECT policy: allow viewing invites created by the user or targeting their client_email (support legacy)
DROP POLICY IF EXISTS "Clients can view their own invites" ON public.user_invites;

CREATE POLICY "Clients can view their own invites"
ON public.user_invites
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR client_email IN (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);

-- UPDATE policy: allow cancel/update invites created by the user or for their client_email (support legacy)
DROP POLICY IF EXISTS "Clients can cancel their own invites" ON public.user_invites;

CREATE POLICY "Clients can cancel their own invites"
ON public.user_invites
FOR UPDATE
TO authenticated
USING (
  invited_by = auth.uid()
  OR client_email IN (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);
