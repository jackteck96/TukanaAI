-- Fix hash functions to use pgcrypto correctly (bytea input)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
      convert_to(
        document_uuid::text || signer_uuid::text || extract(epoch from timestamp_val)::text || 'internal_signature_salt',
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$;

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
      convert_to(
        document_uuid::text || file_path_val || 'document_integrity_salt',
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Adjust OTP clear trigger to avoid NOT NULL violation
CREATE OR REPLACE FUNCTION public.clear_otp_code_after_verify()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_verified = true AND COALESCE(OLD.is_verified, false) = false THEN
    -- redact the code instead of NULL to satisfy NOT NULL constraint
    NEW.verification_code := 'verified';
  END IF;
  RETURN NEW;
END;
$$;