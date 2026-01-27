-- ========================================
-- PLANOS INTERNOS (subscription_plans)
-- ========================================

-- Create subscription_plans table for internal plan management
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  max_users INTEGER,
  max_documents_month INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Only platform admins can manage plans
CREATE POLICY "Platform admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (public.is_platform_admin(auth.uid()));

-- Allow anyone to read active plans (for internal use)
CREATE POLICY "Anyone authenticated can read active plans"
ON public.subscription_plans
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, max_users, max_documents_month, features, display_order)
VALUES
  (
    'Essencial',
    'essencial',
    'Ideal para pequenas empresas iniciando a organização documental',
    5,
    1000,
    '["Organização e centralização de documentos", "Relatórios simples", "Suporte padrão"]'::jsonb,
    1
  ),
  (
    'Profissional',
    'profissional',
    'Para empresas que precisam de controle avançado de processos',
    15,
    3000,
    '["Organização e padronização de processos", "Controle de prazos", "Relatórios completos", "Suporte prioritário"]'::jsonb,
    2
  ),
  (
    'Estratégico',
    'estrategico',
    'Solução completa para grandes operações',
    NULL,
    NULL,
    '["Usuários ilimitados", "Alto volume de documentos", "Processos personalizados", "Relatórios avançados", "Onboarding dedicado", "Suporte premium"]'::jsonb,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- UPDATE discount_coupons to support days
-- ========================================

-- Add discount_duration_days column for more flexibility
ALTER TABLE public.discount_coupons 
ADD COLUMN IF NOT EXISTS discount_duration_days INTEGER;

-- Add pilot_type column to identify pilot coupons
ALTER TABLE public.discount_coupons 
ADD COLUMN IF NOT EXISTS is_pilot_coupon BOOLEAN DEFAULT false;

-- ========================================
-- UPDATE b2b_clients with more fields
-- ========================================

-- Add pilot tracking fields
ALTER TABLE public.b2b_clients 
ADD COLUMN IF NOT EXISTS pilot_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pilot_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS coupon_applied_id UUID REFERENCES public.discount_coupons(id),
ADD COLUMN IF NOT EXISTS access_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Update status enum to include 'encerrado'
ALTER TABLE public.b2b_clients 
DROP CONSTRAINT IF EXISTS b2b_clients_status_check;

-- ========================================
-- Trigger for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_plans_updated_at();

-- ========================================
-- Function to check pilot expiration
-- ========================================

CREATE OR REPLACE FUNCTION public.check_pilot_expiration(client_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record RECORD;
  result JSONB;
BEGIN
  SELECT * INTO client_record
  FROM b2b_clients
  WHERE id = client_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Cliente não encontrado');
  END IF;
  
  -- Check if client is in pilot
  IF client_record.status = 'pilot' THEN
    -- Check if pilot has expired
    IF client_record.pilot_end_date IS NOT NULL AND client_record.pilot_end_date < now() THEN
      -- Block access
      UPDATE b2b_clients
      SET access_blocked = true,
          blocked_at = now(),
          blocked_reason = 'Período de piloto expirado'
      WHERE id = client_uuid;
      
      RETURN jsonb_build_object(
        'status', 'expired',
        'message', 'Período de piloto expirado. Escolha um plano para continuar.',
        'pilot_end_date', client_record.pilot_end_date
      );
    ELSE
      RETURN jsonb_build_object(
        'status', 'active',
        'days_remaining', EXTRACT(DAY FROM (client_record.pilot_end_date - now())),
        'pilot_end_date', client_record.pilot_end_date
      );
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'status', client_record.status,
      'access_blocked', client_record.access_blocked
    );
  END IF;
END;
$$;

-- ========================================
-- Function to apply coupon to client
-- ========================================

CREATE OR REPLACE FUNCTION public.apply_coupon_to_b2b_client(
  p_client_id UUID,
  p_coupon_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  client_record RECORD;
  pilot_duration INTEGER;
  pilot_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get coupon
  SELECT * INTO coupon_record
  FROM discount_coupons
  WHERE code = UPPER(p_coupon_code)
    AND is_active = true
    AND start_date <= now()
    AND expiration_date >= now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom inválido ou expirado');
  END IF;
  
  -- Get client
  SELECT * INTO client_record
  FROM b2b_clients
  WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado');
  END IF;
  
  -- Check usage limit
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Limite de uso do cupom atingido');
  END IF;
  
  -- Check single use restriction
  IF coupon_record.restrict_single_use_per_client THEN
    IF EXISTS (
      SELECT 1 FROM coupon_usage_history
      WHERE coupon_id = coupon_record.id
        AND (cpf_cnpj = client_record.cnpj OR cpf_cnpj = client_record.cpf)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este cupom já foi utilizado por este cliente');
    END IF;
  END IF;
  
  -- Calculate pilot duration
  pilot_duration := COALESCE(coupon_record.discount_duration_days, coupon_record.discount_duration_months * 30, 30);
  pilot_end := now() + (pilot_duration || ' days')::interval;
  
  -- Update client with coupon
  UPDATE b2b_clients
  SET coupon_applied_id = coupon_record.id,
      pilot_start_date = CASE WHEN coupon_record.is_pilot_coupon OR coupon_record.discount_value = 100 THEN now() ELSE pilot_start_date END,
      pilot_end_date = CASE WHEN coupon_record.is_pilot_coupon OR coupon_record.discount_value = 100 THEN pilot_end ELSE pilot_end_date END,
      status = CASE WHEN coupon_record.is_pilot_coupon OR coupon_record.discount_value = 100 THEN 'pilot' ELSE status END,
      access_blocked = false,
      blocked_at = NULL,
      blocked_reason = NULL,
      updated_at = now()
  WHERE id = p_client_id;
  
  -- Increment coupon usage
  UPDATE discount_coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_record.id;
  
  -- Register usage
  INSERT INTO coupon_usage_history (coupon_id, cpf_cnpj, discount_applied, plan_at_use)
  VALUES (
    coupon_record.id,
    COALESCE(client_record.cnpj, client_record.cpf, 'N/A'),
    coupon_record.discount_value,
    client_record.plan
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cupom aplicado com sucesso',
    'discount_value', coupon_record.discount_value,
    'discount_type', coupon_record.discount_type,
    'is_pilot', coupon_record.is_pilot_coupon OR coupon_record.discount_value = 100,
    'pilot_end_date', CASE WHEN coupon_record.is_pilot_coupon OR coupon_record.discount_value = 100 THEN pilot_end ELSE NULL END
  );
END;
$$;