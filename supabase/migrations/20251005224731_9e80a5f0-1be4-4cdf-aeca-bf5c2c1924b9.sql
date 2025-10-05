-- Create company_document_templates table for company-specific document templates
CREATE TABLE public.company_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_document_templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates from their company
CREATE POLICY "Users can view their company templates"
ON public.company_document_templates
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- Authorized users can create templates for their company
CREATE POLICY "Authorized users can create company templates"
ON public.company_document_templates
FOR INSERT
WITH CHECK (
  get_current_user_role() IN ('admin', 'lawyer', 'staff') 
  AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Authorized users can update templates from their company
CREATE POLICY "Authorized users can update company templates"
ON public.company_document_templates
FOR UPDATE
USING (
  get_current_user_role() IN ('admin', 'lawyer', 'staff')
  AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Authorized users can delete templates from their company
CREATE POLICY "Authorized users can delete company templates"
ON public.company_document_templates
FOR DELETE
USING (
  get_current_user_role() IN ('admin', 'lawyer', 'staff')
  AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_company_document_templates_updated_at
BEFORE UPDATE ON public.company_document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_company_document_templates_company_id 
ON public.company_document_templates(company_id);