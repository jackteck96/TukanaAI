-- Enable pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure signature hash generator exists and uses pgcrypto
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
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Ensure document hash generator exists and uses pgcrypto
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
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Security hardening: clear OTP code after successful verification to prevent reuse
CREATE OR REPLACE FUNCTION public.clear_otp_code_after_verify()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_verified = true AND COALESCE(OLD.is_verified, false) = false THEN
    NEW.verification_code := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clear_otp_code_after_verify'
  ) THEN
    CREATE TRIGGER trg_clear_otp_code_after_verify
    BEFORE UPDATE ON public.otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.clear_otp_code_after_verify();
  END IF;
END $$;