-- Create global document types table for admin management
CREATE TABLE public.global_document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  has_validity_date BOOLEAN NOT NULL DEFAULT false,
  has_expiration_date BOOLEAN NOT NULL DEFAULT false,
  requires_issuing_location BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create global document templates table for admin management
CREATE TABLE public.global_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create AI training data table for admin management
CREATE TABLE public.ai_training_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_type TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  suggested_documents TEXT[] NOT NULL DEFAULT '{}',
  conditions TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI training cases table for admin management
CREATE TABLE public.ai_training_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_type TEXT NOT NULL,
  description TEXT NOT NULL,
  documents_received TEXT[] NOT NULL DEFAULT '{}',
  correct_documents TEXT[] NOT NULL DEFAULT '{}',
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all admin tables
ALTER TABLE public.global_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_document_templates ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Only admins can manage global document types"
ON public.global_document_types
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can manage global document templates"
ON public.global_document_templates
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can manage AI training data"
ON public.ai_training_data
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can manage AI training cases"
ON public.ai_training_cases
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Users can view global document types and templates (read-only for non-admins)
CREATE POLICY "Users can view global document types"
ON public.global_document_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view global document templates"
ON public.global_document_templates
FOR SELECT
TO authenticated
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_global_document_types_updated_at
    BEFORE UPDATE ON public.global_document_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_document_templates_updated_at
    BEFORE UPDATE ON public.global_document_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_training_data_updated_at
    BEFORE UPDATE ON public.ai_training_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_training_cases_updated_at
    BEFORE UPDATE ON public.ai_training_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();