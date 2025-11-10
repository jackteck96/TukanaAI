-- Migrar company_id de profiles para user_roles onde está faltando
UPDATE public.user_roles ur
SET company_id = p.company_id
FROM public.profiles p
WHERE ur.user_id = p.id
  AND ur.role = 'company_collaborator'
  AND ur.company_id IS NULL
  AND p.company_id IS NOT NULL;

-- Logar quantos registros foram atualizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Atualizados % registros em user_roles com company_id de profiles', updated_count;
END $$;