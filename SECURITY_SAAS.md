# Documentação de Segurança Multi-Tenant (SaaS)

## Visão Geral

Esta plataforma opera como **SaaS Multi-Tenant** com **isolamento completo entre empresas**. Cada empresa tem seus próprios dados (clientes, processos, documentos) que são completamente isolados das outras empresas.

## Modelo de Isolamento

### 1. **Separação por `company_id`**

Todas as tabelas principais contêm a coluna `company_id` para garantir isolamento:

- ✅ `processes` - Processos pertencem a uma empresa
- ✅ `documents` - Documentos pertencem a uma empresa  
- ✅ `tasks` - Tarefas pertencem a uma empresa
- ✅ `user_roles` - Papéis de usuários vinculados a empresas
- ✅ `collaborator_permissions` - Permissões vinculadas a empresas
- ✅ `document_types` - Tipos de documentos por empresa
- ✅ `company_document_templates` - Templates por empresa

### 2. **Função de Controle de Acesso**

A função principal de controle de acesso é `can_access_process(process_uuid)`:

```sql
CREATE OR REPLACE FUNCTION public.can_access_process(process_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_uuid UUID := auth.uid();
  process_company UUID;
  process_client_email TEXT;
  user_email TEXT;
BEGIN
  -- Buscar company_id do processo
  SELECT company_id, client_email 
  INTO process_company, process_client_email
  FROM public.processes WHERE id = process_uuid;
  
  IF process_company IS NULL THEN RETURN FALSE; END IF;
  
  -- Platform admin tem acesso
  IF is_platform_admin(user_uuid) THEN RETURN TRUE; END IF;
  
  -- Administradores da empresa dona do processo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
      AND company_id = process_company
      AND role = 'company_admin'
  ) THEN RETURN TRUE; END IF;
  
  -- Colaboradores da empresa com permissão para este processo
  IF collaborator_can_access_process(user_uuid, process_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Cliente dono do processo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
      AND role = 'client'
      AND client_email = process_client_email
  ) THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$function$;
```

### 3. **Row Level Security (RLS)**

**Todas as tabelas sensíveis têm RLS habilitado** com políticas que verificam:

1. **Administradores de Empresa**: Podem acessar apenas dados da sua empresa
2. **Colaboradores**: Podem acessar apenas processos permitidos
3. **Clientes**: Podem acessar apenas seus próprios processos
4. **Platform Admins**: Podem acessar tudo (suporte/debug)

Exemplo de política RLS:

```sql
-- Política para tabela processes
CREATE POLICY "Users can view authorized processes"
ON public.processes
FOR SELECT
USING (can_access_process(id));
```

### 4. **Índices de Performance**

Para garantir performance com o isolamento multi-tenant, foram criados índices específicos:

```sql
CREATE INDEX idx_processes_company_id ON public.processes(company_id);
CREATE INDEX idx_documents_company_id ON public.documents(company_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_collaborator_permissions_company_id ON public.collaborator_permissions(company_id);

-- Índices compostos para queries comuns
CREATE INDEX idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX idx_user_roles_role_company ON public.user_roles(role, company_id);
```

## Papéis de Usuários (Roles)

### Hierarquia de Papéis

1. **`platform_admin`** - Administrador da plataforma (acesso total)
2. **`company_admin`** - Administrador de uma empresa específica
3. **`company_collaborator`** - Colaborador de uma empresa
4. **`client`** - Cliente de uma empresa
5. **`client_collaborator`** - Colaborador de um cliente

### Tabela `user_roles`

A tabela `user_roles` é a **fonte única de verdade** para papéis:

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  company_id uuid,          -- Para roles de empresa
  client_email text,        -- Para roles de cliente
  created_at timestamptz
);
```

### Verificação de Papéis

Funções SQL para verificar papéis:

```sql
-- Verificar se usuário tem papel específico
SELECT has_role(user_id, 'company_admin');

-- Verificar se usuário tem qualquer papel de uma lista
SELECT has_any_role(user_id, ARRAY['company_admin', 'company_collaborator']);

-- Verificar se usuário é platform admin
SELECT is_platform_admin(user_id);

-- Verificar se usuário pertence à empresa
SELECT user_belongs_to_company(user_id, company_id);
```

## Sistema de Permissões de Colaboradores

### Tipos de Acesso

1. **`full`** - Acesso a todos os processos da empresa/cliente
2. **`limited`** - Acesso apenas a processos específicos autorizados

### Tabela `collaborator_permissions`

```sql
CREATE TABLE public.collaborator_permissions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid,          -- Para colaboradores de empresa
  client_email text,        -- Para colaboradores de cliente
  access_type text NOT NULL -- 'full' ou 'limited'
);
```

### Tabela `collaborator_process_access`

Para acesso limitado, define processos específicos:

```sql
CREATE TABLE public.collaborator_process_access (
  id uuid PRIMARY KEY,
  permission_id uuid NOT NULL,
  process_id uuid NOT NULL
);
```

### Verificação de Acesso de Colaborador

```sql
CREATE OR REPLACE FUNCTION public.collaborator_can_access_process(_user_id uuid, _process_id uuid)
RETURNS boolean
AS $function$
DECLARE
  permission_record RECORD;
BEGIN
  -- Buscar permissão do usuário para este processo
  SELECT cp.access_type, cp.id, p.company_id, p.client_email
  INTO permission_record
  FROM public.collaborator_permissions cp
  JOIN public.processes p ON (
    (cp.company_id IS NOT NULL AND cp.company_id = p.company_id) OR
    (cp.client_email IS NOT NULL AND cp.client_email = p.client_email)
  )
  WHERE cp.user_id = _user_id 
    AND p.id = _process_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Se tem acesso total, permitir
  IF permission_record.access_type = 'full' THEN RETURN TRUE; END IF;

  -- Se tem acesso limitado, verificar se este processo está autorizado
  IF permission_record.access_type = 'limited' THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.collaborator_process_access
      WHERE permission_id = permission_record.id
        AND process_id = _process_id
    );
  END IF;

  RETURN FALSE;
END;
$function$;
```

## Checklist de Segurança para Novas Features

Ao adicionar novas funcionalidades, **sempre verificar**:

### ✅ **1. Tabela contém `company_id`?**
- [ ] Se a tabela armazena dados de empresa, deve ter `company_id`
- [ ] Se a tabela armazena dados de cliente, pode usar referência a `client_email`

### ✅ **2. RLS está habilitado?**
```sql
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
```

### ✅ **3. Políticas RLS estão configuradas?**
```sql
CREATE POLICY "policy_name"
ON nome_tabela
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'company_collaborator')
  )
);
```

### ✅ **4. Índices de performance foram criados?**
```sql
CREATE INDEX idx_tabela_company_id ON nome_tabela(company_id);
```

### ✅ **5. Funções SQL têm `search_path`?**
```sql
CREATE OR REPLACE FUNCTION func_name()
RETURNS tipo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- ← CRÍTICO
AS $function$
  -- código
$function$;
```

### ✅ **6. Frontend verifica permissões?**
```typescript
// Usar hooks de verificação de papel
const { hasRole, isCompanyUser } = useUserRole();

if (!isCompanyUser) {
  return <Navigate to="/" />;
}
```

### ✅ **7. Edge Functions verificam company_id?**
```typescript
// Buscar company_id do usuário
const { data: userData } = await supabaseClient
  .from('profiles')
  .select('company_id')
  .eq('id', user.id)
  .single();

// Sempre filtrar por company_id
const { data } = await supabaseClient
  .from('processes')
  .select('*')
  .eq('company_id', userData.company_id);
```

## Testes de Isolamento

### Teste Manual Rápido

1. **Criar duas empresas diferentes** (Empresa A e Empresa B)
2. **Criar processos em cada empresa**
3. **Tentar como usuário da Empresa A**:
   - ❌ Acessar processos da Empresa B via URL direta
   - ❌ Modificar `company_id` em requisições
   - ❌ Ver colaboradores da Empresa B na listagem

### Logs de Auditoria

A tabela `security_audit_log` registra ações sensíveis:

```sql
CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

## Boas Práticas

### ✅ **DO (Fazer)**

1. Sempre filtrar por `company_id` em queries
2. Usar `can_access_process()` para verificar acesso a processos
3. Habilitar RLS em todas as tabelas com dados sensíveis
4. Criar índices em colunas `company_id` para performance
5. Adicionar `SET search_path TO 'public'` em funções SECURITY DEFINER
6. Usar `user_roles` como fonte única de verdade para papéis
7. Validar permissões no backend (RLS) e frontend (UX)

### ❌ **DON'T (Não Fazer)**

1. ❌ Confiar apenas em validação frontend
2. ❌ Permitir usuários manipularem `company_id` via frontend
3. ❌ Expor dados sem filtrar por `company_id`
4. ❌ Criar funções SECURITY DEFINER sem `search_path`
5. ❌ Usar `profiles.role` (campo legado) - usar `user_roles`
6. ❌ Permitir acesso cross-company sem verificação explícita
7. ❌ Desabilitar RLS mesmo temporariamente

## Manutenção

### Verificar Segurança Periodicamente

```sql
-- Ver tabelas sem RLS habilitado
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;

-- Ver funções sem search_path
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND security_type = 'DEFINER'
  AND routine_definition NOT LIKE '%search_path%';
```

### Executar Linter de Segurança

Use o linter do Supabase regularmente:

```bash
# Via Supabase CLI
supabase db lint

# Ou via Dashboard
https://supabase.com/dashboard/project/{project_id}/database/linter
```

## Contato e Suporte

Para questões de segurança:
- **Revisão de código**: Sempre revisar PRs que tocam em RLS ou permissões
- **Incidentes**: Documentar e revisar qualquer tentativa de acesso não autorizado
- **Auditoria**: Revisar logs de `security_audit_log` periodicamente

---

**Última atualização**: 2025-11-10  
**Versão**: 1.0
