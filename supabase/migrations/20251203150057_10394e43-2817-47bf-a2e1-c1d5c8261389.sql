-- Enable RLS on user_google_tokens table
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own Google tokens
CREATE POLICY "Users can view their own Google tokens"
ON public.user_google_tokens
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Create policy for users to insert their own Google tokens
CREATE POLICY "Users can insert their own Google tokens"
ON public.user_google_tokens
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- Create policy for users to update their own Google tokens
CREATE POLICY "Users can update their own Google tokens"
ON public.user_google_tokens
FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Create policy for users to delete their own Google tokens
CREATE POLICY "Users can delete their own Google tokens"
ON public.user_google_tokens
FOR DELETE
USING (auth.uid() = auth_user_id);