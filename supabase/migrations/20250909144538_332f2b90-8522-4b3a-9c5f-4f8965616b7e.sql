-- Fix the trigger function to only update usage metrics when company_id is not null
CREATE OR REPLACE FUNCTION public.trigger_update_usage_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only update metrics if company_id is not null
    IF NEW.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(NEW.company_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only update metrics if company_id is not null
    IF OLD.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(OLD.company_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update metrics for new company if not null
    IF NEW.company_id IS NOT NULL THEN
      PERFORM public.update_usage_metrics(NEW.company_id);
    END IF;
    -- Update metrics for old company if different and not null
    IF OLD.company_id IS NOT NULL AND (NEW.company_id IS NULL OR NEW.company_id != OLD.company_id) THEN
      PERFORM public.update_usage_metrics(OLD.company_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;