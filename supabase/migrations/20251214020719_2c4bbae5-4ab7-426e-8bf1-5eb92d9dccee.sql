-- Fix overly permissive RLS policy on profiles table
-- Drop the policy that allows any authenticated user to view all profiles
DROP POLICY IF EXISTS "Require authentication to view profiles" ON profiles;

-- Add company-scoped policy for viewing profiles within the same company
-- This replaces the permissive policy with a more restrictive one
CREATE POLICY "Users can view same-company profiles"
ON profiles FOR SELECT
USING (
  -- User can always view their own profile
  id = auth.uid()
  OR
  -- User can view profiles from the same company
  (
    company_id IS NOT NULL 
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  )
  OR
  -- Platform admins can view all profiles
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role 
    AND company_id IS NULL
  )
);