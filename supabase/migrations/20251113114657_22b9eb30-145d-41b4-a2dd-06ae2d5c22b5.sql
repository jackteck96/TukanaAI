-- Ensure RLS and policies on client_notifications for company and client visibility
DO $$ BEGIN
  -- Enable RLS
  ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- Company staff can view company notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='client_notifications' 
      AND policyname='Company staff can select company notifications'
  ) THEN
    CREATE POLICY "Company staff can select company notifications"
    ON public.client_notifications
    FOR SELECT
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('company_admin','company_collaborator')
      )
    );
  END IF;
END $$;

-- Clients can view their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='client_notifications' 
      AND policyname='Clients can select own notifications'
  ) THEN
    CREATE POLICY "Clients can select own notifications"
    ON public.client_notifications
    FOR SELECT
    TO authenticated
    USING (
      client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );
  END IF;
END $$;

-- Company staff can mark notifications as read for their company
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='client_notifications' 
      AND policyname='Company staff can update company notifications'
  ) THEN
    CREATE POLICY "Company staff can update company notifications"
    ON public.client_notifications
    FOR UPDATE
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('company_admin','company_collaborator')
      )
    )
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('company_admin','company_collaborator')
      )
    );
  END IF;
END $$;

-- Clients can update their own notifications (e.g., mark as read)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='client_notifications' 
      AND policyname='Clients can update own notifications'
  ) THEN
    CREATE POLICY "Clients can update own notifications"
    ON public.client_notifications
    FOR UPDATE
    TO authenticated
    USING (
      client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );
  END IF;
END $$;
