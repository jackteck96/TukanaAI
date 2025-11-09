-- Create table for internal company chat within processes
CREATE TABLE IF NOT EXISTS public.internal_process_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_internal_chat_process ON public.internal_process_chat(process_id, created_at DESC);
CREATE INDEX idx_internal_chat_company ON public.internal_process_chat(company_id);

-- Enable RLS
ALTER TABLE public.internal_process_chat ENABLE ROW LEVEL SECURITY;

-- Policy: Only company staff can view internal chat
CREATE POLICY "Company staff can view internal chat"
ON public.internal_process_chat
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = internal_process_chat.company_id
      AND role IN ('company_admin', 'company_collaborator')
  )
  AND can_access_process(process_id)
);

-- Policy: Only company staff can send messages
CREATE POLICY "Company staff can send messages"
ON public.internal_process_chat
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND company_id = internal_process_chat.company_id
      AND role IN ('company_admin', 'company_collaborator')
  )
  AND can_access_process(process_id)
  AND user_id = auth.uid()
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_process_chat;