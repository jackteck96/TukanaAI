-- Read-only regression checks for the platform-admin invitation boundary.
WITH owner AS (
  SELECT id FROM public.profiles WHERE email = 'raul-cordoni@hotmail.com'
), checks AS (
  SELECT 'platform admin is recognized regardless of company membership' AS rule,
    EXISTS (SELECT 1 FROM owner WHERE public.is_platform_admin(id)) AS passed
  UNION ALL
  SELECT 'company-admin-only accounts cannot invite platform admins',
    NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.role = 'company_admin'
        AND NOT EXISTS (SELECT 1 FROM public.user_roles pa WHERE pa.user_id = ur.user_id AND pa.role = 'platform_admin')
        AND public.is_platform_admin(ur.user_id)
    )
  UNION ALL
  SELECT 'invite creation checks authenticated ownership',
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_invites'
      AND cmd = 'INSERT' AND roles = ARRAY['authenticated']::name[]
      AND with_check LIKE '%is_platform_admin(auth.uid())%'
      AND with_check LIKE '%invited_by = auth.uid()%')
  UNION ALL
  SELECT 'legacy profile role checks are removed',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_invites'
      AND (coalesce(qual, '') LIKE '%profiles%' OR coalesce(with_check, '') LIKE '%profiles%'))
)
SELECT rule, 1 / passed::integer AS assertion FROM checks;