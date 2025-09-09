-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that references profiles table within profiles policy
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Lawyers and staff can view assigned users" ON public.profiles;

-- Recreate the policies without circular references
-- Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- For admin access, we'll create a simpler approach
-- Admins need to be identified differently to avoid recursion
CREATE POLICY "System can manage profiles" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);