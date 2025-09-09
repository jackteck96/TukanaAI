-- Criar tabela para registros de ponto
CREATE TABLE public.time_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'pausa', 'retorno')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Employees can view their own records and admins can view all" 
ON public.time_records 
FOR SELECT 
USING (
  employee_id = auth.uid() OR 
  (get_current_user_role() = 'admin' AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ))
);

CREATE POLICY "Employees can create their own records" 
ON public.time_records 
FOR INSERT 
WITH CHECK (
  employee_id = auth.uid() AND 
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_time_records_updated_at
BEFORE UPDATE ON public.time_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();