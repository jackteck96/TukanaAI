-- Primeiro, vamos limpar processos criados incorretamente
DELETE FROM public.processes WHERE client_email IN ('main.albatross.xfec@rapidletter.net');

-- Corrigir a função generate_invite_token para usar gen_random_uuid() em vez de gen_random_bytes
DROP FUNCTION IF EXISTS public.generate_invite_token();

CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usar gen_random_uuid() e converter para texto limpo
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$$;