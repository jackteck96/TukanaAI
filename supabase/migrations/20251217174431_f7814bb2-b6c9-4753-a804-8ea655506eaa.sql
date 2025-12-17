-- Create global_document_categories table for platform-wide categories
CREATE TABLE public.global_document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_document_categories ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage global categories
CREATE POLICY "Platform admins can insert global categories"
ON public.global_document_categories
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update global categories"
ON public.global_document_categories
FOR UPDATE
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete global categories"
ON public.global_document_categories
FOR DELETE
USING (is_platform_admin(auth.uid()));

-- Everyone authenticated can view global categories
CREATE POLICY "Authenticated users can view global categories"
ON public.global_document_categories
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_global_document_categories_updated_at
BEFORE UPDATE ON public.global_document_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();