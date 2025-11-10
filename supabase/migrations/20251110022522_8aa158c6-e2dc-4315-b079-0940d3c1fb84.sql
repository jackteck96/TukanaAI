-- Corrigir company_id em profiles baseado em convites aceitos
WITH accepted_invites AS (
  SELECT DISTINCT ON (email) email, company_id
  FROM public.user_invites
  WHERE status = 'accepted'
    AND company_id IS NOT NULL
    AND email IS NOT NULL
  ORDER BY email, used_at DESC NULLS LAST
)
UPDATE public.profiles p
SET company_id = ai.company_id
FROM accepted_invites ai
WHERE p.email = ai.email
  AND p.company_id IS NULL;

-- Corrigir company_id em user_roles baseado nos profiles atualizados
UPDATE public.user_roles ur
SET company_id = p.company_id
FROM public.profiles p
WHERE ur.user_id = p.id
  AND ur.role = 'company_collaborator'
  AND ur.company_id IS NULL
  AND p.company_id IS NOT NULL;