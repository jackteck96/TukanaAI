DROP POLICY IF EXISTS "Platform admins can create admin invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Platform admins can update admin invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Platform admins can view admin invites" ON public.admin_invites;
CREATE POLICY "Platform admins can create admin invites" ON public.admin_invites FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()) AND invited_by = auth.uid());
CREATE POLICY "Platform admins can update admin invites" ON public.admin_invites FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can view admin invites" ON public.admin_invites FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));