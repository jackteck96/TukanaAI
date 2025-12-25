-- Mover os tipos de documentos de qualificação para a categoria correta
UPDATE global_document_types 
SET category_id = '319452cb-19b5-4217-a539-ad9f48d12b47'
WHERE name IN (
  'RG - Registro Geral',
  'CPF - Cadastro de Pessoa Física',
  'CNPJ - Cadastro Nacional da Pessoa Jurídica',
  'Cartão CNPJ - Matriz e Filiais',
  'Comprovante de Residência',
  'Comprovante da Sede da Empresa'
);