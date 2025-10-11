-- Add client-specific SELECT policy on tasks so clients can see requests made to them
CREATE POLICY "Clients can view tasks by email"
ON public.tasks
FOR SELECT
USING (
  public.get_current_user_role() = 'client' AND EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = tasks.process_id
      AND p.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);
