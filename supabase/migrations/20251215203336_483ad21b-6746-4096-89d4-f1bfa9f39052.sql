-- Drop the recursive admin policy
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;

-- Create a SECURITY DEFINER function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND company_id IS NULL
  );
$$;

-- Recreate the policy using the safe function
CREATE POLICY "Platform admins can view all profiles" ON public.profiles
FOR SELECT USING (is_platform_admin_safe());