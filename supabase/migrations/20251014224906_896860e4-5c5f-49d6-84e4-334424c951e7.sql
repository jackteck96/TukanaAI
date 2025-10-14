-- Adicionar políticas baseadas em profiles para compatibilidade com usuários 'staff/admin/lawyer'

CREATE POLICY "Company staff can view documents (profiles)"
ON public.documents
FOR SELECT
USING (
  get_current_user_role() IN ('admin','lawyer','staff') AND 
  documents.company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY "Company staff can insert documents (profiles)"
ON public.documents
FOR INSERT
WITH CHECK (
  get_current_user_role() IN ('admin','lawyer','staff') AND 
  documents.company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY "Company staff can update documents (profiles)"
ON public.documents
FOR UPDATE
USING (
  get_current_user_role() IN ('admin','lawyer','staff') AND 
  documents.company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  get_current_user_role() IN ('admin','lawyer','staff') AND 
  documents.company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
);