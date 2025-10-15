-- Enable pgcrypto for digest if not already
create extension if not exists pgcrypto with schema public;

-- Drop and recreate helper functions for hashing used by the app
create or replace function public.generate_signature_hash(
  document_uuid uuid,
  signer_uuid uuid,
  timestamp_val timestamptz
) returns text
language sql
stable
as $$
  select encode(
    digest(
      convert_to(
        document_uuid::text || signer_uuid::text || extract(epoch from timestamp_val)::text || 'internal_signature_salt',
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.generate_document_hash(
  document_uuid uuid,
  file_path_val text
) returns text
language sql
stable
as $$
  select encode(
    digest(
      convert_to(
        document_uuid::text || coalesce(file_path_val, '') || 'document_integrity_salt',
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;