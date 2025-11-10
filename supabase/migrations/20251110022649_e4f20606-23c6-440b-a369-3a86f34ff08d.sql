-- Atualizar company_id em profiles e user_roles para TODOS os colaboradores
-- usando o último convite (mais recente) de cada email
WITH latest_invites AS (
  SELECT DISTINCT ON (email) 
    email, 
    company_id
  FROM public.user_invites
  WHERE company_id IS NOT NULL
    AND email IS NOT NULL
  ORDER BY email, created_at DESC
)
UPDATE public.profiles p
SET company_id = li.company_id
FROM latest_invites li
WHERE p.email = li.email
  AND p.company_id IS NULL
  AND p.role IN ('staff', 'lawyer');

-- Agora atualizar user_roles
UPDATE public.user_roles ur
SET company_id = p.company_id  
FROM public.profiles p
WHERE ur.user_id = p.id
  AND ur.role = 'company_collaborator'
  AND ur.company_id IS NULL
  AND p.company_id IS NOT NULL;