-- Permitir notificações sem documento específico e adicionar tipo information_request
ALTER TABLE public.client_notifications 
  ALTER COLUMN document_id DROP NOT NULL;

-- Remover constraint antigo e adicionar novo com information_request
ALTER TABLE public.client_notifications 
  DROP CONSTRAINT IF EXISTS client_notifications_notification_type_check;

ALTER TABLE public.client_notifications 
  ADD CONSTRAINT client_notifications_notification_type_check 
  CHECK (notification_type IN ('document_rejected', 'document_adjustment_requested', 'information_request', 'signatures_complete', 'document_uploaded'));