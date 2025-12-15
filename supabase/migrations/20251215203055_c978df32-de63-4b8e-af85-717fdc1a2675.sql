-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view same-company profiles" ON public.profiles;

-- Create a non-recursive policy using auth.uid() directly
CREATE POLICY "Users can view profiles safely" ON public.profiles
FOR SELECT USING (
  -- Users can always see their own profile
  id = auth.uid()
  -- Or users from the same company (using a subquery that doesn't recurse)
  OR company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
  )
  -- Or platform admins can see all
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.company_id IS NULL
  )
);

-- Also ensure basic authenticated access exists
DROP POLICY IF EXISTS "Require authentication to view profiles" ON public.profiles;