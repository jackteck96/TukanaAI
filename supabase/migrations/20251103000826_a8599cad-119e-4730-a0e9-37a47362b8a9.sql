-- Atualizar status dos documentos existentes para 'valid'
UPDATE public.partner_documents
SET 
  social_contract_status = CASE 
    WHEN social_contract_path IS NOT NULL THEN 'valid'
    ELSE 'pending'
  END,
  rg_status = CASE 
    WHEN rg_path IS NOT NULL THEN 'valid'
    ELSE 'pending'
  END,
  cpf_status = CASE 
    WHEN cpf_path IS NOT NULL THEN 'valid'
    ELSE 'pending'
  END,
  address_proof_status = CASE 
    WHEN address_proof_path IS NOT NULL THEN 'valid'
    ELSE 'pending'
  END
WHERE id IS NOT NULL;