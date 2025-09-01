# Configuração do Supabase para o Sistema Fuzen

## Passos para configurar a autenticação completa:

### 1. Conectar ao Supabase
- Clique no botão verde **Supabase** no canto superior direito da interface
- Conecte sua conta do Supabase ou crie uma nova

### 2. Criar o banco de dados
- No painel do Supabase, vá para **SQL Editor**
- Copie e cole o conteúdo do arquivo `public/supabase-setup.sql`
- Execute o SQL para criar as tabelas e políticas necessárias

### 3. Configurar variáveis de ambiente
- No painel do Supabase, vá para **Settings** → **API**
- Copie a **Project URL** e a **anon/public key**
- No Lovable, adicione essas variáveis nas configurações do projeto:
  - `VITE_SUPABASE_URL`: Cole a Project URL
  - `VITE_SUPABASE_ANON_KEY`: Cole a anon/public key

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