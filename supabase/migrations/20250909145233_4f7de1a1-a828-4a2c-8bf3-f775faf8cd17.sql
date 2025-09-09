-- Allow authenticated users to create companies during signup
CREATE POLICY "Users can create companies during signup" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to create subscriptions for companies they create
CREATE POLICY "Users can create subscriptions for their companies" 
ON public.subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (true);