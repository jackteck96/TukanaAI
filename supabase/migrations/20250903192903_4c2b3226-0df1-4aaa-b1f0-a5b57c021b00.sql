-- Criar bucket para armazenar documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Criar tabela de processos
CREATE TABLE public.processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  process_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  priority TEXT NOT NULL DEFAULT 'Média',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER NOT NULL DEFAULT 0
);

-- Criar tabela de documentos
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relatórios de documentos
CREATE TABLE public.document_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_documents INTEGER NOT NULL DEFAULT 0,
  pending_documents INTEGER NOT NULL DEFAULT 0,
  approved_documents INTEGER NOT NULL DEFAULT 0
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para processes (por enquanto público para desenvolvimento)
CREATE POLICY "Anyone can view processes" 
ON public.processes FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create processes" 
ON public.processes FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update processes" 
ON public.processes FOR UPDATE 
USING (true);

-- Políticas para documents
CREATE POLICY "Anyone can view documents" 
ON public.documents FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create documents" 
ON public.documents FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update documents" 
ON public.documents FOR UPDATE 
USING (true);

-- Políticas para document_reports
CREATE POLICY "Anyone can view document reports" 
ON public.document_reports FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create document reports" 
ON public.document_reports FOR INSERT 
WITH CHECK (true);

-- Políticas de storage para documentos
CREATE POLICY "Anyone can view documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can update documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'documents');

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_processes_updated_at
BEFORE UPDATE ON public.processes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar relatório de documentos automaticamente
CREATE OR REPLACE FUNCTION public.generate_document_report(process_uuid UUID)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  doc_data JSONB;
  total_docs INTEGER;
  pending_docs INTEGER;
  approved_docs INTEGER;
BEGIN
  -- Contar documentos
  SELECT COUNT(*) INTO total_docs 
  FROM public.documents 
  WHERE process_id = process_uuid;
  
  SELECT COUNT(*) INTO pending_docs 
  FROM public.documents 
  WHERE process_id = process_uuid AND status = 'Pendente';
  
  SELECT COUNT(*) INTO approved_docs 
  FROM public.documents 
  WHERE process_id = process_uuid AND status = 'Aprovado';
  
  -- Coletar dados dos documentos
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'file_name', file_name,
        'file_path', file_path,
        'document_type', document_type,
        'status', status,
        'uploaded_by', uploaded_by,
        'created_at', created_at
      )
    ), 
    '[]'::jsonb
  ) INTO doc_data
  FROM public.documents 
  WHERE process_id = process_uuid;
  
  -- Inserir relatório
  INSERT INTO public.document_reports 
    (process_id, report_data, total_documents, pending_documents, approved_documents)
  VALUES 
    (process_uuid, doc_data, total_docs, pending_docs, approved_docs)
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;