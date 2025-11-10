-- Criar edge function para processar aceitação de convite de colaborador e configurar permissões
CREATE OR REPLACE FUNCTION public.process_collaborator_invite_acceptance(
  p_user_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_permission_id UUID;
  v_process_id TEXT;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invite
  FROM public.user_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite não encontrado ou expirado'
    );
  END IF;

  -- Criar role de colaborador se for de empresa
  IF v_invite.company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (p_user_id, 'company_collaborator', v_invite.company_id)
    ON CONFLICT DO NOTHING;

    -- Criar permissão de colaborador
    INSERT INTO public.collaborator_permissions (
      user_id,
      company_id,
      access_type,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      v_invite.company_id,
      COALESCE(v_invite.access_type, 'full'),
      now(),
      now()
    )
    RETURNING id INTO v_permission_id;

    -- Se for acesso limitado, criar registros de processos específicos
    IF v_invite.access_type = 'limited' AND v_invite.allowed_process_ids IS NOT NULL THEN
      FOR v_process_id IN SELECT unnest(v_invite.allowed_process_ids)
      LOOP
        INSERT INTO public.collaborator_process_access (
          permission_id,
          process_id,
          created_at
        )
        VALUES (
          v_permission_id,
          v_process_id::UUID,
          now()
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- Criar role de colaborador de cliente se for convite de cliente
  IF v_invite.client_email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, client_email)
    VALUES (p_user_id, 'client_collaborator', v_invite.client_email)
    ON CONFLICT DO NOTHING;

    -- Criar permissão de colaborador de cliente
    INSERT INTO public.collaborator_permissions (
      user_id,
      client_email,
      access_type,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      v_invite.client_email,
      COALESCE(v_invite.access_type, 'full'),
      now(),
      now()
    )
    RETURNING id INTO v_permission_id;

    -- Se for acesso limitado, criar registros de processos específicos
    IF v_invite.access_type = 'limited' AND v_invite.allowed_process_ids IS NOT NULL THEN
      FOR v_process_id IN SELECT unnest(v_invite.allowed_process_ids)
      LOOP
        INSERT INTO public.collaborator_process_access (
          permission_id,
          process_id,
          created_at
        )
        VALUES (
          v_permission_id,
          v_process_id::UUID,
          now()
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- Marcar convite como aceito
  UPDATE public.user_invites
  SET status = 'accepted',
      used_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'permission_id', v_permission_id,
    'access_type', COALESCE(v_invite.access_type, 'full')
  );
END;
$$;

-- Adicionar colunas necessárias em user_invites se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_invites' AND column_name = 'access_type') THEN
    ALTER TABLE public.user_invites ADD COLUMN access_type TEXT CHECK (access_type IN ('full', 'limited'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_invites' AND column_name = 'allowed_process_ids') THEN
    ALTER TABLE public.user_invites ADD COLUMN allowed_process_ids TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_invites' AND column_name = 'client_email') THEN
    ALTER TABLE public.user_invites ADD COLUMN client_email TEXT;
  END IF;
END
$$;