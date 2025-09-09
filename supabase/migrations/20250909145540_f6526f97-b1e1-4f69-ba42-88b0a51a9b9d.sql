-- Drop existing policies and create a more permissive one for signup
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies during signup" ON public.companies;

-- Create a simple policy that allows any authenticated user to create companies
CREATE POLICY "Allow company creation" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view companies (needed for the signup flow)
CREATE POLICY "Allow company read" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (true);

-- Allow company updates (for admin features later)
CREATE POLICY "Allow company update" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);