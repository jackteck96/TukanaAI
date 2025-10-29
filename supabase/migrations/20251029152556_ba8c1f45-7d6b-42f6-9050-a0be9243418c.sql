-- Create storage bucket for partner documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-documents', 
  'partner-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Create table for partner documents
CREATE TABLE public.partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Document fields
  social_contract_path TEXT,
  social_contract_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  rg_path TEXT,
  rg_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  cpf_path TEXT,
  cpf_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  address_proof_path TEXT,
  address_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(client_email, company_id)
);

-- Enable RLS
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own documents
CREATE POLICY "Clients can view their own partner documents"
ON public.partner_documents
FOR SELECT
USING (
  client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- RLS Policy: Clients can insert their own documents
CREATE POLICY "Clients can insert their own partner documents"
ON public.partner_documents
FOR INSERT
WITH CHECK (
  client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- RLS Policy: Clients can update their own documents
CREATE POLICY "Clients can update their own partner documents"
ON public.partner_documents
FOR UPDATE
USING (
  client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- RLS Policy: Company staff can view documents of their clients
CREATE POLICY "Company staff can view their clients partner documents"
ON public.partner_documents
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
  AND get_current_user_role() IN ('admin', 'lawyer', 'staff')
);

-- Storage RLS Policies
-- Clients can upload their own documents
CREATE POLICY "Clients can upload their own partner documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Clients can view their own documents
CREATE POLICY "Clients can view their own partner documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'partner-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Clients can update their own documents
CREATE POLICY "Clients can update their own partner documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'partner-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Clients can delete their own documents
CREATE POLICY "Clients can delete their own partner documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'partner-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Company staff can view documents of their clients
CREATE POLICY "Company staff can view their clients partner documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'partner-documents'
  AND EXISTS (
    SELECT 1 FROM public.partner_documents pd
    WHERE pd.client_email = (storage.foldername(name))[1]
    AND pd.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  AND get_current_user_role() IN ('admin', 'lawyer', 'staff')
);

-- Trigger for updated_at
CREATE TRIGGER update_partner_documents_updated_at
BEFORE UPDATE ON public.partner_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();