-- Permitir convites de clientes sem processo vinculado
ALTER TABLE client_invites 
ALTER COLUMN process_id DROP NOT NULL;

COMMENT ON COLUMN client_invites.process_id IS 'ID do processo associado (opcional - pode ser NULL para convites diretos de clientes)';