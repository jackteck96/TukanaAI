-- Add missing columns to clients table
ALTER TABLE public.clients
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN email_preference text DEFAULT 'register_only' CHECK (email_preference IN ('send_now', 'register_only'));

-- Add index for better performance
CREATE INDEX idx_clients_created_by ON public.clients(created_by);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.created_by IS 'User who created this client record';
COMMENT ON COLUMN public.clients.email_preference IS 'Whether to send email now or later (send_now, register_only)';