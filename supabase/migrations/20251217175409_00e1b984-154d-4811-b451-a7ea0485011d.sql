-- Fix RLS so platform admins (new user_roles model) can manage global document types

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.global_document_types ENABLE ROW LEVEL SECURITY;

-- Drop legacy restrictive policy (if exists)
DROP POLICY IF EXISTS "Only admins can manage global document types" ON public.global_document_types;

-- Allow platform admins to INSERT global document types
CREATE POLICY "Platform admins can insert global document types"
ON public.global_document_types
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR public.get_current_user_role() = 'admin'::public.user_role
);

-- Allow platform admins to UPDATE global document types
CREATE POLICY "Platform admins can update global document types"
ON public.global_document_types
FOR UPDATE
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR public.get_current_user_role() = 'admin'::public.user_role
)
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR public.get_current_user_role() = 'admin'::public.user_role
);

-- Allow platform admins to DELETE global document types
CREATE POLICY "Platform admins can delete global document types"
ON public.global_document_types
FOR DELETE
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR public.get_current_user_role() = 'admin'::public.user_role
);
