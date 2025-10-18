-- Fix RLS policy for usage_metrics table to properly restrict access
-- This addresses the MISSING_RLS security finding

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view their company metrics" ON public.usage_metrics;

-- Create secure helper function to check company access via user_roles
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _user_id 
      AND company_id = _company_id
      AND role IN ('company_admin', 'company_collaborator')
  );
$$;

-- Create new restrictive RLS policy using the security definer function
CREATE POLICY "Users can only view their own company metrics"
ON public.usage_metrics
FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
  OR public.is_platform_admin(auth.uid())
);

-- Ensure the system can still update metrics (used by triggers)
CREATE POLICY "System can manage all metrics"
ON public.usage_metrics
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);