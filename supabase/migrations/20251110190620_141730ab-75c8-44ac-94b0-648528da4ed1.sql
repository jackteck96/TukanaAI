-- Adicionar search_path às funções restantes que estavam faltando

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.update_terms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.document_requests
  SET current_status = 'enviado',
      last_upload_id = NEW.id,
      last_uploaded_at = now(),
      updated_at = now()
  WHERE id = NEW.document_request_id;

  UPDATE public.processes
  SET status = 'enviado',
      updated_at = now()
  WHERE id = NEW.process_id AND status IS DISTINCT FROM 'enviado';

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_usage_metrics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(NEW.company_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(OLD.company_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(NEW.company_id);
    END IF;
    IF OLD.company_id IS NOT NULL AND (NEW.company_id IS NULL OR NEW.company_id != OLD.company_id) THEN
      PERFORM public.update_usage_metrics(OLD.company_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.archive_partner_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.social_contract_path IS DISTINCT FROM OLD.social_contract_path 
     AND OLD.social_contract_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'social_contract', OLD.social_contract_path, 
      OLD.social_contract_uploaded_at, auth.uid()
    );
  END IF;
  
  IF NEW.rg_path IS DISTINCT FROM OLD.rg_path 
     AND OLD.rg_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'rg', OLD.rg_path, OLD.rg_uploaded_at, auth.uid()
    );
  END IF;
  
  IF NEW.cpf_path IS DISTINCT FROM OLD.cpf_path 
     AND OLD.cpf_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'cpf', OLD.cpf_path, OLD.cpf_uploaded_at, auth.uid()
    );
  END IF;
  
  IF NEW.address_proof_path IS DISTINCT FROM OLD.address_proof_path 
     AND OLD.address_proof_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'address_proof', OLD.address_proof_path, 
      OLD.address_proof_uploaded_at, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_expiring_documents(days_ahead integer DEFAULT 30)
RETURNS TABLE(document_id uuid, document_name text, document_type text, expiration_date date, days_until_expiration integer, process_id uuid, client_name text, client_email text, company_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.file_name as document_name,
    d.document_type,
    d.expiration_date,
    (d.expiration_date - CURRENT_DATE)::integer as days_until_expiration,
    p.id as process_id,
    p.client_name,
    p.client_email,
    p.company_id,
    CASE 
      WHEN d.expiration_date < CURRENT_DATE THEN 'expired'
      WHEN d.expiration_date <= CURRENT_DATE + days_ahead THEN 'expiring_soon'
      ELSE 'valid'
    END as status
  FROM public.documents d
  INNER JOIN public.processes p ON d.process_id = p.id
  WHERE 
    d.expiration_date IS NOT NULL
    AND d.expiration_date <= CURRENT_DATE + days_ahead
    AND d.status = 'Aprovado'
  ORDER BY d.expiration_date ASC;
END;
$function$;