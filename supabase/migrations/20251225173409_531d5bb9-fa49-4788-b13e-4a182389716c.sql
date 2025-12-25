-- 1. Criar a categoria "Qualificação"
INSERT INTO global_document_categories (name, display_order)
VALUES ('Qualificação', 0);

-- 2. Mover os tipos de documentos para a nova categoria
UPDATE global_document_types 
SET category_id = (SELECT id FROM global_document_categories WHERE name = 'Qualificação')
WHERE name IN ('RG', 'CPF', 'Cartão CNPJ', 'CNPJ', 'Comprovante de Residência', 'Comprovante da Sede da Empresa');