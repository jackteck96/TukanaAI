-- Tabela de clientes B2B (gestão interna)
CREATE TABLE public.b2b_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  cpf TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (status IN ('pilot', 'active', 'cancelled')),
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cupons de desconto
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  restrict_single_use_per_client BOOLEAN NOT NULL DEFAULT true,
  eligible_plans TEXT[] NOT NULL DEFAULT ARRAY['starter', 'professional', 'enterprise'],
  discount_duration_months INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de uso de cupons
CREATE TABLE public.coupon_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.b2b_clients(id) ON DELETE SET NULL,
  cpf_cnpj TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discount_applied NUMERIC(10, 2) NOT NULL,
  plan_at_use TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_b2b_clients_status ON public.b2b_clients(status);
CREATE INDEX idx_b2b_clients_company_id ON public.b2b_clients(company_id);
CREATE INDEX idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX idx_discount_coupons_active ON public.discount_coupons(is_active);
CREATE INDEX idx_coupon_usage_cpf_cnpj ON public.coupon_usage_history(cpf_cnpj);
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage_history(coupon_id);

-- RLS
ALTER TABLE public.b2b_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage_history ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas platform_admin pode acessar
CREATE POLICY "Platform admins can manage b2b_clients"
ON public.b2b_clients
FOR ALL
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage discount_coupons"
ON public.discount_coupons
FOR ALL
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage coupon_usage_history"
ON public.coupon_usage_history
FOR ALL
USING (public.is_platform_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_b2b_clients_updated_at
BEFORE UPDATE ON public.b2b_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discount_coupons_updated_at
BEFORE UPDATE ON public.discount_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar e aplicar cupom
CREATE OR REPLACE FUNCTION public.validate_and_apply_coupon(
  p_coupon_code TEXT,
  p_cpf_cnpj TEXT,
  p_plan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_result JSONB;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon
  FROM public.discount_coupons
  WHERE code = UPPER(p_coupon_code)
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom não encontrado ou inativo');
  END IF;
  
  -- Verificar data de expiração
  IF v_coupon.expiration_date < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom expirado');
  END IF;
  
  -- Verificar data de início
  IF v_coupon.start_date > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom ainda não está válido');
  END IF;
  
  -- Verificar limite de usos total
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Limite de usos do cupom atingido');
  END IF;
  
  -- Verificar plano elegível
  IF NOT (p_plan = ANY(v_coupon.eligible_plans)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom não válido para este plano');
  END IF;
  
  -- Verificar uso único por CPF/CNPJ
  IF v_coupon.restrict_single_use_per_client THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_usage_history
    WHERE coupon_id = v_coupon.id
      AND cpf_cnpj = p_cpf_cnpj;
    
    IF v_usage_count > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este CPF/CNPJ já utilizou este cupom');
    END IF;
  END IF;
  
  -- Cupom válido
  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_duration_months', v_coupon.discount_duration_months
  );
END;
$$;

-- Função para registrar uso do cupom
CREATE OR REPLACE FUNCTION public.register_coupon_usage(
  p_coupon_id UUID,
  p_client_id UUID,
  p_cpf_cnpj TEXT,
  p_discount_applied NUMERIC,
  p_plan TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Registrar uso
  INSERT INTO public.coupon_usage_history (
    coupon_id, client_id, cpf_cnpj, discount_applied, plan_at_use
  ) VALUES (
    p_coupon_id, p_client_id, p_cpf_cnpj, p_discount_applied, p_plan
  );
  
  -- Incrementar contador de usos
  UPDATE public.discount_coupons
  SET current_uses = current_uses + 1
  WHERE id = p_coupon_id;
  
  RETURN TRUE;
END;
$$;