-- Fix function search_path for notify_new_user_signup
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://devnkdyfzlgspdlfuyam.supabase.co/functions/v1/notify-new-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldm5rZHlmemxnc3BkbGZ1eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDE5MDEsImV4cCI6MjA3MTI3NzkwMX0.MMh37AaJ2S0-9s0FKgf8StBx74vQvzkX42Dji4dEi2E'
      ),
      body := jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', COALESCE(NEW.full_name, 'Não informado'),
        'created_at', NEW.created_at
      )
    );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in notify_new_user_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;