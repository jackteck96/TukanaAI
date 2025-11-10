-- Função para criar/atualizar permissões de colaborador com verificação de autorização
CREATE OR REPLACE FUNCTION public.upsert_collaborator_permissions(
  p_target_user_id uuid,
  p_company_id uuid,
  p_client_email text,
  p_access_type text,
  p_process_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission_id uuid;
  v_is_authorized boolean := false;
  v_ctx text;
BEGIN
  IF (p_company_id IS NULL AND p_client_email IS NULL) OR (p_company_id IS NOT NULL AND p_client_email IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contexto inválido');
  END IF;

  IF p_access_type NOT IN ('full','limited') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de acesso inválido');
  END IF;

  -- Verificar autorização do chamador
  IF p_company_id IS NOT NULL THEN
    v_ctx := 'company';
    -- Preferência: user_roles (modelo novo)
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'company_admin'
        AND company_id = p_company_id
    ) INTO v_is_authorized;

    -- Fallback legado: profiles.role
    IF NOT v_is_authorized THEN
      SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND company_id = p_company_id
      ) INTO v_is_authorized;
    END IF;
  ELSE
    v_ctx := 'client';
    -- Preferência: user_roles (modelo novo)
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'client'
        AND client_email = p_client_email
    ) INTO v_is_authorized;

    -- Fallback legado: profiles.email + role
    IF NOT v_is_authorized THEN
      SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'client'
          AND email = p_client_email
      ) INTO v_is_authorized;
    END IF;
  END IF;

  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Upsert da permissão
  IF v_ctx = 'company' THEN
    SELECT id INTO v_permission_id
    FROM public.collaborator_permissions
    WHERE user_id = p_target_user_id AND company_id = p_company_id
    LIMIT 1;

    IF v_permission_id IS NULL THEN
      INSERT INTO public.collaborator_permissions(user_id, company_id, access_type)
      VALUES (p_target_user_id, p_company_id, p_access_type)
      RETURNING id INTO v_permission_id;
    ELSE
      UPDATE public.collaborator_permissions
      SET access_type = p_access_type, updated_at = now()
      WHERE id = v_permission_id;
    END IF;
  ELSE
    SELECT id INTO v_permission_id
    FROM public.collaborator_permissions
    WHERE user_id = p_target_user_id AND client_email = p_client_email
    LIMIT 1;

    IF v_permission_id IS NULL THEN
      INSERT INTO public.collaborator_permissions(user_id, client_email, access_type)
      VALUES (p_target_user_id, p_client_email, p_access_type)
      RETURNING id INTO v_permission_id;
    ELSE
      UPDATE public.collaborator_permissions
      SET access_type = p_access_type, updated_at = now()
      WHERE id = v_permission_id;
    END IF;
  END IF;

  -- Gerenciar processos autorizados
  IF p_access_type = 'full' THEN
    DELETE FROM public.collaborator_process_access WHERE permission_id = v_permission_id;
  ELSE
    DELETE FROM public.collaborator_process_access WHERE permission_id = v_permission_id;
    IF p_process_ids IS NOT NULL AND array_length(p_process_ids, 1) > 0 THEN
      INSERT INTO public.collaborator_process_access(permission_id, process_id)
      SELECT v_permission_id, pid FROM unnest(p_process_ids) AS pid
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'permission_id', v_permission_id);
END;
$$;