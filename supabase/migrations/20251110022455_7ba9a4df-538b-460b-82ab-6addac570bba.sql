-- Corrigir company_id em profiles baseado em user_invites aceitos
UPDATE public.profiles p
SET company_id = ui.company_id
FROM public.user_invites ui
WHERE p.email = ui.email
  AND ui.status = 'accepted'
  AND ui.company_id IS NOT NULL
  AND p.company_id IS NULL
  AND p.role IN ('staff', 'lawyer');

-- Corrigir company_id em user_roles baseado em profiles que foram corrigidos
UPDATE public.user_roles ur
SET company_id = p.company_id
FROM public.profiles p
WHERE ur.user_id = p.id
  AND ur.role = 'company_collaborator'
  AND ur.company_id IS NULL
  AND p.company_id IS NOT NULL;