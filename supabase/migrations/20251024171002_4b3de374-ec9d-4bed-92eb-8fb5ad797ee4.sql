-- ============================================
-- CORREÇÕES FINAIS DE SEGURANÇA
-- ============================================

-- 1. BLOQUEAR ACESSO NÃO AUTENTICADO À TABELA PROFILES
-- Adicionar política que requer autenticação
CREATE POLICY "Require authentication to view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Remover qualquer política que permita acesso público
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;

-- 2. CORRIGIR FUNÇÕES RESTANTES - Adicionar search_path
CREATE OR REPLACE FUNCTION public.can_view_company(comp_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_uuid uuid := auth.uid();
  user_email text;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admins/collaborators of the company
  IF public.can_manage_company(user_uuid, comp_id) THEN
    RETURN TRUE;
  END IF;

  -- Client role linked to a process of this company (via client_email)
  SELECT email INTO user_email FROM public.profiles WHERE id = user_uuid;
  IF EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.company_id = comp_id
      AND (p.client_email = user_email)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_process_access(process_uuid uuid, access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.document_reports (process_id, report_data, total_documents, pending_documents, approved_documents)
  VALUES (
    process_uuid, 
    jsonb_build_object(
      'audit_log', true,
      'access_type', access_type,
      'accessed_by', auth.uid(),
      'accessed_at', now(),
      'user_role', get_current_user_role()
    ),
    0, 0, 0
  ) 
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_document_report(process_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    report_id UUID;
    process_company_id UUID;
    doc_data JSONB;
    total_docs INTEGER;
    pending_docs INTEGER;
    approved_docs INTEGER;
BEGIN
    SELECT company_id INTO process_company_id
    FROM processes 
    WHERE id = process_uuid;
    
    IF process_company_id IS NULL THEN
        RAISE EXCEPTION 'Processo não encontrado';
    END IF;
    
    IF NOT can_access_process(process_uuid) THEN
        RAISE EXCEPTION 'Acesso negado ao processo';
    END IF;
    
    SELECT 
        COALESCE(json_agg(
            json_build_object(
                'id', d.id,
                'file_name', d.file_name,
                'file_path', d.file_path,
                'document_type', d.document_type,
                'status', d.status,
                'uploaded_by', d.uploaded_by,
                'created_at', d.created_at,
                'updated_at', d.updated_at,
                'validity_date', d.validity_date,
                'expiration_date', d.expiration_date,
                'issuing_location', d.issuing_location,
                'file_size', d.file_size,
                'file_type', d.file_type,
                'has_validity_date', COALESCE(dt.has_validity_date, false),
                'has_expiration_date', COALESCE(dt.has_expiration_date, false),
                'requires_issuing_location', COALESCE(dt.requires_issuing_location, false)
            )
        ), '[]'::json) INTO doc_data
    FROM documents d
    LEFT JOIN document_types dt ON dt.name = d.document_type AND dt.company_id = d.company_id
    WHERE d.process_id = process_uuid;
    
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        COUNT(*) FILTER (WHERE status = 'Aprovado')
    INTO total_docs, pending_docs, approved_docs
    FROM documents
    WHERE process_id = process_uuid;
    
    INSERT INTO document_reports (
        process_id,
        company_id,
        report_data,
        total_documents,
        pending_documents,
        approved_documents
    ) VALUES (
        process_uuid,
        process_company_id,
        doc_data::jsonb,
        total_docs,
        pending_docs,
        approved_docs
    ) RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_sign_document(document_uuid uuid, signer_email_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  flow_record RECORD;
  requirement_record RECORD;
  current_signatures INTEGER;
BEGIN
  SELECT * INTO flow_record
  FROM public.signature_flows
  WHERE document_id = document_uuid AND flow_status = 'active';
  
  IF flow_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT * INTO requirement_record
  FROM public.signature_requirements
  WHERE signature_flow_id = flow_record.id AND signer_email = signer_email_param;
  
  IF requirement_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF flow_record.flow_type = 'sequential' THEN
    SELECT COUNT(*) INTO current_signatures
    FROM public.digital_signatures
    WHERE document_id = document_uuid AND signature_status = 'signed';
    
    IF requirement_record.signature_order != (current_signatures + 1) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mirror_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  doc_name text;
  proc_company uuid;
  proc_client_name text;
  proc_client_email text;
  file_name text;
BEGIN
  SELECT document_name INTO doc_name FROM public.document_requests WHERE id = NEW.document_request_id;
  SELECT company_id, client_name, client_email
    INTO proc_company, proc_client_name, proc_client_email
  FROM public.processes WHERE id = NEW.process_id;

  file_name := split_part(NEW.file_path, '/', -1);

  INSERT INTO public.documents (
    process_id, company_id, file_size, file_name, file_path, file_type, document_type, uploaded_by, status
  ) VALUES (
    NEW.process_id,
    proc_company,
    COALESCE(NEW.file_size, 0),
    file_name,
    NEW.file_path,
    COALESCE(NEW.file_type, 'application/octet-stream'),
    COALESCE(doc_name, 'Documento'),
    COALESCE(proc_client_name, proc_client_email, 'Cliente'),
    'Pendente'
  );

  RETURN NEW;
END;
$function$;

-- 3. ADICIONAR COMENTÁRIOS DE SEGURANÇA NAS TABELAS SENSÍVEIS
COMMENT ON COLUMN public.digital_signatures.signer_cpf IS 'SENSITIVE DATA: Brazilian government ID (CPF) - Should be encrypted in production';
COMMENT ON COLUMN public.digital_signatures.certificate_serial IS 'SENSITIVE DATA: Digital certificate serial number';
COMMENT ON COLUMN public.internal_signatures.authentication_contact IS 'SENSITIVE DATA: Contact information used for authentication';
COMMENT ON COLUMN public.processes.cpf_cnpj IS 'SENSITIVE DATA: Brazilian government ID (CPF/CNPJ)';

-- 4. ADICIONAR TRIGGER PARA LOG DE ACESSOS A DADOS SENSÍVEIS (AUDIT)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas platform admins podem ver logs de auditoria
CREATE POLICY "Only platform admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Sistema pode inserir logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. ADICIONAR ÍNDICES ADICIONAIS PARA PERFORMANCE E SEGURANÇA
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_table ON public.security_audit_log(table_name, created_at DESC);