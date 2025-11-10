-- Permitir process_id nulo em internal_signatures para suportar documentos standalone
ALTER TABLE internal_signatures 
ALTER COLUMN process_id DROP NOT NULL;