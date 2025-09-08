-- First, let's enhance the can_access_process function to be more restrictive and add firm isolation
CREATE OR REPLACE FUNCTION public.can_access_process(process_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE
    user_role user_role;
    user_firm_id uuid;
    is_assigned BOOLEAN;
    is_creator BOOLEAN;
    process_firm_id uuid;
    process_client_email text;
    user_email text;
  BEGIN
    -- Get current user role and firm
    SELECT role, firm_id, email INTO user_role, user_firm_id, user_email
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- If no profile found, deny access
    IF user_role IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Get process details
    SELECT 
      (assigned_user_id = auth.uid()),
      (created_by = auth.uid()),
      client_email
    INTO is_assigned, is_creator, process_client_email
    FROM public.processes 
    WHERE id = process_uuid;
    
    -- If process not found, deny access
    IF process_client_email IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Admins can access everything within their firm (if firm_id is implemented)
    -- For now, admins have full access but this should be restricted to firm level
    IF user_role = 'admin' THEN
      RETURN TRUE;
    END IF;
    
    -- Lawyers and staff can ONLY access processes they are specifically assigned to or created
    IF user_role IN ('lawyer', 'staff') THEN
      RETURN (is_assigned = TRUE OR is_creator = TRUE);
    END IF;
    
    -- Clients can only access processes where they are the actual client (email match)
    IF user_role = 'client' THEN
      RETURN (process_client_email = user_email);
    END IF;
    
    -- Default deny
    RETURN FALSE;
  END;
$function$;

-- Update the profiles table RLS policies to be more restrictive
-- Users should only see profiles they need to see for their work

-- Drop existing profile policies to recreate them more securely
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- More restrictive profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Admins can view profiles, but in a production environment this should be firm-scoped
CREATE POLICY "Admins can view profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Lawyers and staff can only view profiles of users assigned to their processes
CREATE POLICY "Lawyers and staff can view assigned users" 
ON public.profiles 
FOR SELECT 
USING (
  get_current_user_role() IN ('lawyer'::user_role, 'staff'::user_role) 
  AND (
    id = auth.uid() -- Own profile
    OR EXISTS ( -- Users assigned to processes they can access
      SELECT 1 FROM public.processes p 
      WHERE (p.assigned_user_id = profiles.id OR p.created_by = profiles.id)
      AND can_access_process(p.id)
    )
  )
);

-- Add audit logging function for sensitive access
CREATE OR REPLACE FUNCTION public.log_process_access(process_uuid uuid, access_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- In a production environment, you would log this to an audit table
  -- For now, we'll use a simple approach
  INSERT INTO public.document_reports (process_id, report_data, total_documents, pending_documents, approved_documents)
  VALUES (
    process_uuid, 
    jsonb_build_object(
      'audit_log', true,
      'access_type', access_type,
      'accessed_by', auth.uid(),
      'accessed_at', now(),
      'user_role', get_current_user_role()
    ),
    0, 0, 0
  ) 
  ON CONFLICT DO NOTHING; -- Prevent duplicate audit logs
EXCEPTION WHEN OTHERS THEN
  -- Ignore audit logging errors to not block legitimate access
  NULL;
END;
$function$;