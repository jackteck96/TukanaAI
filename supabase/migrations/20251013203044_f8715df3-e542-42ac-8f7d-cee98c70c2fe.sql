-- Dar poder de platform_admin ao usuário raul-cordoni@hotmail.com

-- Inserir ou atualizar o role de platform_admin
INSERT INTO public.user_roles (user_id, role, company_id, client_email)
VALUES ('48255df9-5ced-4afe-9594-9a4578c1a56d'::UUID, 'platform_admin'::app_role, NULL, NULL)
ON CONFLICT (user_id, role, company_id, client_email) 
DO UPDATE SET updated_at = now();

-- Também manter o company_admin para não perder acesso à empresa
INSERT INTO public.user_roles (user_id, role, company_id, client_email)
VALUES (
  '48255df9-5ced-4afe-9594-9a4578c1a56d'::UUID, 
  'company_admin'::app_role, 
  'd2e9d840-a906-4472-aeda-3b9117cec1cf'::UUID, 
  NULL
)
ON CONFLICT (user_id, role, company_id, client_email) 
DO UPDATE SET updated_at = now();