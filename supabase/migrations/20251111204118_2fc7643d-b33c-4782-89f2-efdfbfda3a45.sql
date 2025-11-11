-- Create security definer function to check if user can create client collaborator invites
CREATE OR REPLACE FUNCTION public.can_create_client_invite(target_client_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the authenticated user's email
  SELECT email INTO user_email 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a client (new model via user_roles)
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('client', 'client_collaborator')
      AND ur.client_email = user_email
  ) THEN
    -- Verify target_client_email matches user's email
    RETURN target_client_email = user_email;
  END IF;
  
  -- Check if user is a client (legacy model via profiles.role)
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'::user_role
  ) THEN
    -- Verify target_client_email matches user's email
    RETURN target_client_email = user_email;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Drop and recreate INSERT policy using the security definer function
DROP POLICY IF EXISTS "Clients can create invites for their collaborators" ON public.user_invites;

CREATE POLICY "Clients can create invites for their collaborators"
ON public.user_invites
FOR INSERT
TO authenticated
WITH CHECK (
  -- Use security definer function to check authorization
  public.can_create_client_invite(client_email)
  AND
  -- Only allow creating client collaborator invites
  role = 'staff'::user_role
);