-- Permitir que clientes excluam suas próprias notificações
CREATE POLICY "Clients can delete their own notifications"
ON public.client_notifications
FOR DELETE
TO authenticated
USING (
  client_email = (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);