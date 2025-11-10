-- Sincronizar company_id de colaboradores baseado nos convites
DO $$
DECLARE
  collab_email TEXT;
  collab_company UUID;
  collab_user_id UUID;
  updated_profiles INT := 0;
  updated_roles INT := 0;
BEGIN
  -- Para cada convite de colaborador (aceito ou expirado mas usado)
  FOR collab_email, collab_company IN
    SELECT DISTINCT ON (ui.email) ui.email, ui.company_id
    FROM public.user_invites ui
    WHERE ui.company_id IS NOT NULL
      AND ui.email IS NOT NULL
      AND (ui.status = 'accepted' OR (ui.status = 'expired' AND ui.used_at IS NOT NULL))
    ORDER BY ui.email, ui.used_at DESC NULLS LAST, ui.created_at DESC
  LOOP
    -- Atualizar profile (apenas roles legados)
    UPDATE public.profiles p
    SET company_id = collab_company
    WHERE p.email = collab_email
      AND p.company_id IS NULL
      AND p.role IN ('staff', 'lawyer');
    
    IF FOUND THEN
      updated_profiles := updated_profiles + 1;
    END IF;

    -- Pegar user_id do profile
    SELECT id INTO collab_user_id
    FROM public.profiles
    WHERE email = collab_email;

    -- Atualizar user_roles se encontrou o usuário
    IF collab_user_id IS NOT NULL THEN
      UPDATE public.user_roles ur
      SET company_id = collab_company
      WHERE ur.user_id = collab_user_id
        AND ur.role = 'company_collaborator'
        AND ur.company_id IS NULL;
      
      IF FOUND THEN
        updated_roles := updated_roles + 1;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Atualizados % profiles e % user_roles com company_id', updated_profiles, updated_roles;
END $$;