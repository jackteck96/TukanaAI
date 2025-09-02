# 🔧 CONFIGURAÇÃO URGENTE - Supabase Sistema Fuzen

## ⚠️ ERRO RESOLVIDO - Configure agora:

### PASSO 1: Configurar Variáveis (OBRIGATÓRIO)
1. Acesse seu painel do Supabase
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** 
   - **anon/public key**
4. No arquivo `.env.local` (já criado), substitua:
   - `sua_url_do_supabase_aqui` pela Project URL
   - `sua_chave_anonima_do_supabase_aqui` pela anon/public key

### PASSO 2: Configurar Banco de Dados
- No Supabase, vá para **SQL Editor**
- Execute o SQL do arquivo `public/supabase-setup.sql`

### 4. Configurar autenticação
- No Supabase, vá para **Authentication** → **Settings**
- Configure as URLs de redirecionamento se necessário
- Ative os provedores de autenticação desejados (email/password já está ativo)

### 5. Testar o sistema
Agora você pode:
- ✅ Cadastrar novas empresas em `/register`
- ✅ Fazer login em `/login`  
- ✅ Acessar dashboards específicos por role (admin/funcionário vs cliente)
- ✅ Criar tipos de documentos (apenas admins)
- ✅ Criar modelos de documentos (apenas admins)
- ✅ Sistema multi-tenant (cada empresa vê apenas seus dados)

### 6. Estrutura do Sistema

**Roles do Sistema:**
- `admin`: Administrador da empresa (acesso total)
- `employee`: Funcionário da empresa (acesso limitado)
- `client`: Cliente da empresa (apenas visualiza seus processos)

**Tabelas Criadas:**
- `companies`: Dados das empresas
- `profiles`: Perfis dos usuários (vinculados aos users do auth)
- `document_types`: Tipos de documentos por empresa
- `document_templates`: Modelos de documentos por empresa

**Segurança (RLS):**
- Cada empresa só vê seus próprios dados
- Clientes só veem seus próprios processos
- Apenas admins podem gerenciar configurações

### 7. Próximos passos recomendados
Após a configuração básica, você pode:
- Adicionar mais tabelas para documentos reais dos clientes
- Implementar upload de arquivos usando Supabase Storage
- Criar notificações por email
- Adicionar webhooks para integrações
- Implementar assinatura digital

## Troubleshooting

**Erro de conexão:**
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o SQL foi executado completamente

**Erro de permissions:**
- Verifique se as políticas RLS foram criadas
- Confirme que o usuário tem o role correto na tabela profiles

**Usuário não aparece após cadastro:**
- Verifique se o trigger `on_auth_user_created` foi criado
- Confirme que os dados da empresa foram inseridos corretamente