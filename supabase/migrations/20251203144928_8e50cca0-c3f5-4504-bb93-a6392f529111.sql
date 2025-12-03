-- Function to notify new user creation via edge function
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.full_name, 'Não informado'),
      'created_at', NEW.created_at
    )
  );

  -- Call edge function asynchronously via pg_net
  PERFORM net.http_post(
    url := 'https://devnkdyfzlgspdlfuyam.supabase.co/functions/v1/notify-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the trigger
  RAISE WARNING 'Failed to send new user notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new user signups
DROP TRIGGER IF EXISTS on_new_user_signup ON public.profiles;
CREATE TRIGGER on_new_user_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_signup();