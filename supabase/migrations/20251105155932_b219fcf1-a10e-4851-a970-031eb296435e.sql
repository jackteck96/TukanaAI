-- Criar tabela para armazenar tokens OAuth do Google
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_google_tokens_company ON public.google_calendar_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON public.google_calendar_tokens(user_id);

-- Habilitar RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own Google tokens"
  ON public.google_calendar_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Company admins can view company tokens"
  ON public.google_calendar_tokens
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna para armazenar meeting_url nos processos
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMP WITH TIME ZONE;