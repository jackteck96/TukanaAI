-- Adicionar coluna phone na tabela profiles se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    
    -- Criar índice para busca por telefone
    CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
  END IF;
END
$$;