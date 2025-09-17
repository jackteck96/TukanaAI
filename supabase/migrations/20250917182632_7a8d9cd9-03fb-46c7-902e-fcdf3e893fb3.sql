-- Criar tabela de notificações para clientes
CREATE TABLE public.client_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL,
  document_id UUID NOT NULL,
  client_email TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('document_rejected', 'document_adjustment_requested')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Clients can view their own notifications" 
ON public.client_notifications 
FOR SELECT 
USING (
  client_email = (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company staff can create notifications" 
ON public.client_notifications 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin'::user_role, 'lawyer'::user_role, 'staff'::user_role]) 
  AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own notifications" 
ON public.client_notifications 
FOR UPDATE 
USING (
  client_email = (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_client_notifications_updated_at
BEFORE UPDATE ON public.client_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();