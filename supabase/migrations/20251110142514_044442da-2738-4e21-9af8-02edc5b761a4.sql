-- Create storage bucket for internal chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('internal-chat-attachments', 'internal-chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Add attachment columns to internal_process_chat
ALTER TABLE public.internal_process_chat 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- RLS policies for internal-chat-attachments bucket
-- Company staff can upload attachments for their company processes
CREATE POLICY "Company staff can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'internal-chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM processes p
    INNER JOIN user_roles ur ON ur.company_id = p.company_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY(ARRAY['company_admin'::app_role, 'company_collaborator'::app_role])
  )
);

-- Company staff can view attachments from their company processes
CREATE POLICY "Company staff can view chat attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'internal-chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM processes p
    INNER JOIN user_roles ur ON ur.company_id = p.company_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY(ARRAY['company_admin'::app_role, 'company_collaborator'::app_role])
  )
);

-- Company staff can delete their own attachments
CREATE POLICY "Company staff can delete their own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'internal-chat-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM processes p
    INNER JOIN user_roles ur ON ur.company_id = p.company_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY(ARRAY['company_admin'::app_role, 'company_collaborator'::app_role])
  )
);