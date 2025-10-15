-- Enable pgcrypto for digest/hash functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Harden hash helper functions with explicit casts (avoid unknown type issues)
CREATE OR REPLACE FUNCTION public.generate_signature_hash(
  document_uuid uuid,
  signer_uuid uuid,
  timestamp_val timestamptz
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || signer_uuid::text || extract(epoch from timestamp_val)::text || 'internal_signature_salt',
      'sha256'::text
    ),
    'hex'
  );
END;$$;

CREATE OR REPLACE FUNCTION public.generate_document_hash(
  document_uuid uuid,
  file_path_val text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || file_path_val || 'document_integrity_salt',
      'sha256'::text
    ),
    'hex'
  );
END;$$;

-- SECURITY HARDENING
-- 1) Profiles: remove overly permissive policy and restrict to self
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;

CREATE POLICY "profiles_self_select"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_self_update"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "profiles_self_insert"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 2) Helper function to check company visibility
CREATE OR REPLACE FUNCTION public.can_view_company(comp_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
END;$$;

-- 3) Companies: restrict access using helper
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- Drop extremely permissive policies if present
DROP POLICY IF EXISTS "companies_all_access" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for all" ON public.companies;
DROP POLICY IF EXISTS "Enable update for all" ON public.companies;

CREATE POLICY "companies_select_limited"
ON public.companies
FOR SELECT
USING (public.can_view_company(id));

CREATE POLICY "companies_modify_restricted"
ON public.companies
FOR UPDATE
USING (public.can_manage_company(auth.uid(), id));

CREATE POLICY "companies_insert_restricted"
ON public.companies
FOR INSERT
WITH CHECK (public.can_manage_company(auth.uid(), id));

-- 4) Internal signatures: restrict visibility to users who can access the process
ALTER TABLE public.internal_signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "internal_signatures_open_select" ON public.internal_signatures;

CREATE POLICY "internal_signatures_select_by_access"
ON public.internal_signatures
FOR SELECT
USING (public.can_access_process(process_id));

-- Allow inserts/updates only via service role (edge functions) – no general insert policy
-- 5) OTP verifications: strict per-user access
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "otp_all_access" ON public.otp_verifications;

CREATE POLICY "otp_insert_self"
ON public.otp_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "otp_select_self"
ON public.otp_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "otp_update_self"
ON public.otp_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Optional: performance index for document signatures
CREATE INDEX IF NOT EXISTS idx_internal_signatures_document_id ON public.internal_signatures(document_id);
