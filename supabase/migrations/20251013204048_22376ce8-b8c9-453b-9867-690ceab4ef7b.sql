-- Grant platform_admin to the specific admin email
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'raul-cordoni@hotmail.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, company_id, client_email)
    VALUES (v_user_id, 'platform_admin'::app_role, NULL, NULL)
    ON CONFLICT (user_id, role, company_id, client_email)
    DO UPDATE SET updated_at = now();
  END IF;
END $$;