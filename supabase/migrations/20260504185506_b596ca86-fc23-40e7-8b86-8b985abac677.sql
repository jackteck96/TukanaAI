
-- =========================================================
-- ATUALIZA PLANOS: Starter / Growth / Business / Enterprise
-- =========================================================

-- Novas colunas em subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_active_cases_month INTEGER,
  ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER,
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS price_label TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cta_type TEXT DEFAULT 'subscribe',
  ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Permitir leitura pública dos planos ativos para a Landing Page
DROP POLICY IF EXISTS "Public can read public active plans" ON public.subscription_plans;
CREATE POLICY "Public can read public active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true AND COALESCE(is_public, true) = true);

-- Limpar planos antigos e inserir os novos 4 planos
DELETE FROM public.subscription_plans WHERE slug IN ('essencial','profissional','estrategico','starter','growth','business','enterprise');

INSERT INTO public.subscription_plans
  (name, slug, description, max_users, max_active_cases_month, max_storage_gb, price_cents, price_label, cta_type, is_highlighted, display_order, features, is_active, is_public)
VALUES
  ('Starter','starter','Para equipes pequenas começando a organizar processos',
    3, 2, 15, 29700, 'R$ 297/mês', 'subscribe', false, 1,
    '["Até 3 usuários","Até 2 casos ativos/mês","15GB de armazenamento","Suporte padrão"]'::jsonb, true, true),
  ('Growth','growth','Para empresas em crescimento que precisam de mais capacidade',
    10, 5, 50, 79700, 'R$ 797/mês', 'subscribe', false, 2,
    '["Até 10 usuários","Até 5 casos ativos/mês","50GB de armazenamento","Suporte prioritário"]'::jsonb, true, true),
  ('Business','business','Para operações estruturadas com alto volume',
    25, 15, 150, 199700, 'R$ 1.997/mês', 'subscribe', true, 3,
    '["Até 25 usuários","Até 15 casos ativos/mês","150GB de armazenamento","Suporte premium","Onboarding dedicado"]'::jsonb, true, true),
  ('Enterprise','enterprise','Solução personalizada para grandes operações',
    NULL, NULL, NULL, NULL, 'Sob consulta', 'contact_sales', false, 4,
    '["Usuários ilimitados","Casos ativos ilimitados","Armazenamento ilimitado","SLA dedicado","Integrações personalizadas"]'::jsonb, true, true);

-- =========================================================
-- subscriptions: vincular ao plano e suportar Stripe
-- =========================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Migrar planos antigos para os novos
UPDATE public.subscriptions s
SET subscription_plan_id = sp.id
FROM public.subscription_plans sp
WHERE sp.slug = CASE
  WHEN s.plan::text = 'starter' THEN 'starter'
  WHEN s.plan::text = 'professional' THEN 'growth'
  WHEN s.plan::text = 'enterprise' THEN 'enterprise'
  ELSE 'starter'
END
AND s.subscription_plan_id IS NULL;

-- =========================================================
-- Função: contar processos criados no mês atual
-- =========================================================
CREATE OR REPLACE FUNCTION public.count_active_cases_current_month(company_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.processes
  WHERE company_id = company_uuid
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month';
$$;

-- =========================================================
-- Nova check_plan_limits: usa subscription_plans + casos/storage
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_plan_limits(company_uuid UUID, limit_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_record RECORD;
  current_usage NUMERIC;
  plan_limit NUMERIC;
  result JSONB;
BEGIN
  SELECT sp.* INTO plan_record
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.subscription_plan_id
  WHERE s.company_id = company_uuid
  ORDER BY s.updated_at DESC
  LIMIT 1;

  -- Fallback: starter
  IF plan_record.id IS NULL THEN
    SELECT * INTO plan_record FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
  END IF;

  IF limit_type = 'users' THEN
    SELECT user_count INTO current_usage FROM public.usage_metrics WHERE company_id = company_uuid;
    plan_limit := plan_record.max_users;
  ELSIF limit_type = 'active_cases' THEN
    current_usage := public.count_active_cases_current_month(company_uuid);
    plan_limit := plan_record.max_active_cases_month;
  ELSIF limit_type = 'storage' THEN
    SELECT COALESCE(storage_used_bytes,0) INTO current_usage FROM public.usage_metrics WHERE company_id = company_uuid;
    plan_limit := CASE WHEN plan_record.max_storage_gb IS NULL THEN NULL
                       ELSE plan_record.max_storage_gb::bigint * 1024 * 1024 * 1024 END;
  ELSIF limit_type = 'documents' THEN
    SELECT document_count INTO current_usage FROM public.usage_metrics WHERE company_id = company_uuid;
    plan_limit := plan_record.max_documents_month;
  END IF;

  result := jsonb_build_object(
    'current_usage', COALESCE(current_usage, 0),
    'limit', COALESCE(plan_limit, -1),
    'plan', plan_record.slug,
    'plan_name', plan_record.name,
    'can_add', (plan_limit IS NULL OR COALESCE(current_usage,0) < plan_limit)
  );

  RETURN result;
END;
$$;
