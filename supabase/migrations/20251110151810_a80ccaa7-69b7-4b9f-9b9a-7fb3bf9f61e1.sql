-- Create SELECT policy for company admins to view user_roles rows of their company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Company admins can view company user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Company admins can view company user roles" '
      'ON public.user_roles '
      'FOR SELECT '
      'USING ( '
      '  company_id IS NOT NULL '
      '  AND EXISTS ( '
      '    SELECT 1 FROM public.user_roles ur '
      '    WHERE ur.user_id = auth.uid() '
      '      AND ur.role = ''company_admin'' '
      '      AND ur.company_id = user_roles.company_id '
      '  ) '
      ')';
  END IF;
END$$;

-- Create SELECT policy for users to view their own role rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Users can view their own roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own roles" '
      'ON public.user_roles '
      'FOR SELECT '
      'USING ( '
      '  user_id = auth.uid() '
      ')';
  END IF;
END$$;