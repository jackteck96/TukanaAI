-- Tabela para templates de campos personalizados (pré-definidos pela empresa)
CREATE TABLE public.client_custom_field_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, date, number, select, checkbox
  is_required BOOLEAN NOT NULL DEFAULT false,
  options TEXT[] DEFAULT '{}', -- Para campos do tipo select
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para valores dos campos personalizados de cada cliente
CREATE TABLE public.client_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.client_custom_field_templates(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_custom_field_templates_company ON public.client_custom_field_templates(company_id);
CREATE INDEX idx_custom_field_values_client ON public.client_custom_field_values(client_id);
CREATE INDEX idx_custom_field_values_company ON public.client_custom_field_values(company_id);

-- Enable RLS
ALTER TABLE public.client_custom_field_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies para templates
CREATE POLICY "Company staff can view their templates"
  ON public.client_custom_field_templates FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can create templates"
  ON public.client_custom_field_templates FOR INSERT
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can update templates"
  ON public.client_custom_field_templates FOR UPDATE
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can delete templates"
  ON public.client_custom_field_templates FOR DELETE
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

-- RLS Policies para valores
CREATE POLICY "Company staff can view custom field values"
  ON public.client_custom_field_values FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can create custom field values"
  ON public.client_custom_field_values FOR INSERT
  WITH CHECK (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can update custom field values"
  ON public.client_custom_field_values FOR UPDATE
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Company staff can delete custom field values"
  ON public.client_custom_field_values FOR DELETE
  USING (user_belongs_to_company(auth.uid(), company_id) OR is_platform_admin(auth.uid()));

-- Clients can view their own custom field values
CREATE POLICY "Clients can view own custom field values"
  ON public.client_custom_field_values FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.profiles p ON p.email = c.email
    WHERE c.id = client_custom_field_values.client_id
    AND p.id = auth.uid()
  ));

-- Triggers para updated_at
CREATE TRIGGER update_custom_field_templates_updated_at
  BEFORE UPDATE ON public.client_custom_field_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON public.client_custom_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();