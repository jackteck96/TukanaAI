-- Create document_categories table
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to document_types
ALTER TABLE public.document_types 
ADD COLUMN category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL;

-- Add category_id to global_document_types
ALTER TABLE public.global_document_types 
ADD COLUMN category_id UUID;

-- Enable RLS
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_categories
CREATE POLICY "Users can view categories from their company"
ON public.document_categories
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can insert categories"
ON public.document_categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = document_categories.company_id
    AND role = 'company_admin'
  )
);

CREATE POLICY "Company admins can update categories"
ON public.document_categories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = document_categories.company_id
    AND role = 'company_admin'
  )
);

CREATE POLICY "Company admins can delete categories"
ON public.document_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = document_categories.company_id
    AND role = 'company_admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_document_categories_updated_at
BEFORE UPDATE ON public.document_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_document_categories_company_id ON public.document_categories(company_id);
CREATE INDEX idx_document_types_category_id ON public.document_types(category_id);