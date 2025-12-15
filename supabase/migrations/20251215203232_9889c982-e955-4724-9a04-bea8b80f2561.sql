-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles safely" ON public.profiles;

-- Create a SECURITY DEFINER function to get current user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- Create non-recursive policies for profiles
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can view profiles in the same company (using the secure function)
CREATE POLICY "Users can view company profiles" ON public.profiles
FOR SELECT USING (
  company_id IS NOT NULL 
  AND company_id = get_my_company_id()
);

-- Policy 3: Platform admins can view all profiles
CREATE POLICY "Platform admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.company_id IS NULL
  )
);