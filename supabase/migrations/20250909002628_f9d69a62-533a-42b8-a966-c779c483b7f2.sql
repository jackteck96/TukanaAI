-- Create enum for subscription plans
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'expired', 'canceled');

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'starter',
  status subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  stripe_subscription_id TEXT, -- For future Stripe integration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Create usage_metrics table
CREATE TABLE public.usage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_count INTEGER NOT NULL DEFAULT 0,
  document_count INTEGER NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Add company_id to existing tables
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.processes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.document_reports ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view their company" ON public.companies
FOR SELECT USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update their company" ON public.companies
FOR UPDATE USING (
  id IN (
    SELECT company_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update their company subscription" ON public.subscriptions
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for usage_metrics
CREATE POLICY "Users can view their company metrics" ON public.usage_metrics
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "System can update metrics" ON public.usage_metrics
FOR ALL USING (true);

-- Update existing RLS policies to include company filtering
DROP POLICY IF EXISTS "Users can view authorized processes" ON public.processes;
CREATE POLICY "Users can view authorized processes" ON public.processes
FOR SELECT USING (
  can_access_process(id) AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update authorized processes" ON public.processes;
CREATE POLICY "Users can update authorized processes" ON public.processes
FOR UPDATE USING (
  can_access_process(id) AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authorized users can create processes" ON public.processes;
CREATE POLICY "Authorized users can create processes" ON public.processes
FOR INSERT WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin'::user_role, 'lawyer'::user_role, 'staff'::user_role]) AND
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Update documents policies
DROP POLICY IF EXISTS "Users can view documents from authorized processes" ON public.documents;
CREATE POLICY "Users can view documents from authorized processes" ON public.documents
FOR SELECT USING (
  can_access_process(process_id) AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create documents for authorized processes" ON public.documents;
CREATE POLICY "Users can create documents for authorized processes" ON public.documents
FOR INSERT WITH CHECK (
  can_access_process(process_id) AND
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update documents from authorized processes" ON public.documents;
CREATE POLICY "Users can update documents from authorized processes" ON public.documents
FOR UPDATE USING (
  can_access_process(process_id) AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Update document_reports policies
DROP POLICY IF EXISTS "Users can view reports for authorized processes" ON public.document_reports;
CREATE POLICY "Users can view reports for authorized processes" ON public.document_reports
FOR SELECT USING (
  can_access_process(process_id) AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create reports for authorized processes" ON public.document_reports;
CREATE POLICY "Users can create reports for authorized processes" ON public.document_reports
FOR INSERT WITH CHECK (
  can_access_process(process_id) AND
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create function to check plan limits
CREATE OR REPLACE FUNCTION public.check_plan_limits(company_uuid UUID, limit_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_plan subscription_plan;
  current_usage INTEGER;
  plan_limit INTEGER;
  result JSONB;
BEGIN
  -- Get company plan
  SELECT s.plan INTO company_plan
  FROM public.subscriptions s
  WHERE s.company_id = company_uuid AND s.status = 'active';
  
  -- If no active subscription, default to starter
  IF company_plan IS NULL THEN
    company_plan := 'starter';
  END IF;
  
  -- Get current usage
  IF limit_type = 'users' THEN
    SELECT user_count INTO current_usage
    FROM public.usage_metrics
    WHERE company_id = company_uuid;
  ELSIF limit_type = 'documents' THEN
    SELECT document_count INTO current_usage
    FROM public.usage_metrics
    WHERE company_id = company_uuid;
  END IF;
  
  -- Set plan limits
  IF company_plan = 'starter' THEN
    plan_limit := CASE WHEN limit_type = 'users' THEN 3 ELSE 100 END;
  ELSIF company_plan = 'professional' THEN
    plan_limit := CASE WHEN limit_type = 'users' THEN 10 ELSE 1000 END;
  ELSE -- enterprise
    plan_limit := -1; -- unlimited
  END IF;
  
  result := jsonb_build_object(
    'current_usage', COALESCE(current_usage, 0),
    'limit', plan_limit,
    'plan', company_plan,
    'can_add', (plan_limit = -1 OR COALESCE(current_usage, 0) < plan_limit)
  );
  
  RETURN result;
END;
$$;

-- Create function to update usage metrics
CREATE OR REPLACE FUNCTION public.update_usage_metrics(company_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count_val INTEGER;
  document_count_val INTEGER;
  storage_used_val BIGINT;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO user_count_val
  FROM public.profiles
  WHERE company_id = company_uuid;
  
  -- Count documents
  SELECT COUNT(*) INTO document_count_val
  FROM public.documents
  WHERE company_id = company_uuid;
  
  -- Calculate storage used
  SELECT COALESCE(SUM(file_size), 0) INTO storage_used_val
  FROM public.documents
  WHERE company_id = company_uuid;
  
  -- Upsert metrics
  INSERT INTO public.usage_metrics (company_id, user_count, document_count, storage_used_bytes, last_calculated_at)
  VALUES (company_uuid, user_count_val, document_count_val, storage_used_val, now())
  ON CONFLICT (company_id) DO UPDATE SET
    user_count = EXCLUDED.user_count,
    document_count = EXCLUDED.document_count,
    storage_used_bytes = EXCLUDED.storage_used_bytes,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
END;
$$;

-- Create triggers for automatic usage updates
CREATE OR REPLACE FUNCTION public.trigger_update_usage_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_usage_metrics(NEW.company_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_usage_metrics(OLD.company_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.update_usage_metrics(NEW.company_id);
    IF NEW.company_id != OLD.company_id THEN
      PERFORM public.update_usage_metrics(OLD.company_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER update_usage_metrics_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_usage_metrics();

CREATE TRIGGER update_usage_metrics_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_usage_metrics();

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON public.usage_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();