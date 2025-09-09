-- Create document_types table
CREATE TABLE public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  has_validity_date BOOLEAN NOT NULL DEFAULT false,
  has_expiration_date BOOLEAN NOT NULL DEFAULT false,
  requires_issuing_location BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view document types from their company" 
ON public.document_types 
FOR SELECT 
USING (company_id IN ( SELECT profiles.company_id
  FROM profiles
  WHERE (profiles.id = auth.uid())));

CREATE POLICY "Users can create document types for their company" 
ON public.document_types 
FOR INSERT 
WITH CHECK (company_id IN ( SELECT profiles.company_id
  FROM profiles
  WHERE (profiles.id = auth.uid())));

CREATE POLICY "Users can update document types from their company" 
ON public.document_types 
FOR UPDATE 
USING (company_id IN ( SELECT profiles.company_id
  FROM profiles
  WHERE (profiles.id = auth.uid())));

CREATE POLICY "Users can delete document types from their company" 
ON public.document_types 
FOR DELETE 
USING (company_id IN ( SELECT profiles.company_id
  FROM profiles
  WHERE (profiles.id = auth.uid())));

-- Add trigger for updated_at
CREATE TRIGGER update_document_types_updated_at
BEFORE UPDATE ON public.document_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add cpf_cnpj column to processes table
ALTER TABLE public.processes 
ADD COLUMN cpf_cnpj TEXT;