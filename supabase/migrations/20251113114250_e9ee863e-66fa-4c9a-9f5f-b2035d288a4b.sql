-- Allow clients and company staff to insert client_notifications for signature events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_notifications' AND policyname = 'Users can insert their own signature notifications'
  ) THEN
    CREATE POLICY "Users can insert their own signature notifications"
    ON public.client_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- client can insert notifications tied to their email
      client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      OR
      -- company staff can insert notifications for their company
      company_id IN (
        SELECT company_id FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('company_admin','company_collaborator')
      )
    );
  END IF;
END $$;