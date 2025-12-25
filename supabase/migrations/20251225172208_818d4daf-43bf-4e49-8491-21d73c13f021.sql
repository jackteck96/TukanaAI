-- 1. Deletar os tipos de documento "Outros"
DELETE FROM global_document_types WHERE name = 'Outros';

-- 2. Mover todos os documentos sem categoria para "Certidões e Regularidade"
UPDATE global_document_types 
SET category_id = 'ee34196c-72cc-4cfc-9d85-353a981fc8a8'
WHERE category_id IS NULL;

-- 3. Deletar a categoria "Outros Documentos"
DELETE FROM global_document_categories WHERE id = '22efa571-9805-4a6d-a474-12a26d446988';