-- Atualizar política RLS para permitir que company_admin veja registros de ponto
DROP POLICY IF EXISTS "Employees can view their own records and admins can view all" ON public.time_records;

CREATE POLICY "Employees can view their own records and admins can view all"
ON public.time_records
FOR SELECT
USING (
  employee_id = auth.uid() 
  OR 
  (
    get_current_user_role() = 'admin'::user_role 
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'company_admin'
        AND company_id = time_records.company_id
    )
  )
);