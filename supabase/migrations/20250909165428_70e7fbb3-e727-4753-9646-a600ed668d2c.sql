-- Fix existing processes with null company_id by setting a default company
UPDATE processes 
SET company_id = (
  SELECT id 
  FROM companies 
  LIMIT 1
) 
WHERE company_id IS NULL;