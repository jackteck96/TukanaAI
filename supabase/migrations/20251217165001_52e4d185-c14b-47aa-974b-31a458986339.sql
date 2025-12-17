-- Add RLS policies for platform admins to manage document categories

-- Allow platform admins to view all categories
CREATE POLICY "Platform admins can view all categories"
ON public.document_categories
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to insert categories
CREATE POLICY "Platform admins can insert categories"
ON public.document_categories
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

-- Allow platform admins to update categories
CREATE POLICY "Platform admins can update categories"
ON public.document_categories
FOR UPDATE
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to delete categories
CREATE POLICY "Platform admins can delete categories"
ON public.document_categories
FOR DELETE
USING (is_platform_admin(auth.uid()));