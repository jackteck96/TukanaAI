-- Fuzen - Setup do Banco de Dados Supabase
-- Execute este SQL no editor SQL do Supabase após conectar a integração

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'client')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_types table
CREATE TABLE document_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    has_expiry_date BOOLEAN DEFAULT FALSE,
    has_issue_location BOOLEAN DEFAULT FALSE,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_templates table
CREATE TABLE document_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Companies policies
CREATE POLICY "Users can view own company" ON companies 
    FOR SELECT USING (
        id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

-- Document types policies
CREATE POLICY "Company members can view document types" ON document_types 
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage document types" ON document_types 
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin')
        )
    );

-- Document templates policies
CREATE POLICY "Company members can view templates" ON document_templates 
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage templates" ON document_templates 
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin')
        )
    );

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role, company_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        COALESCE(NEW.raw_user_meta_data->>'company_id', '')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert example data (opcional - remover em produção)
INSERT INTO companies (name, domain) VALUES 
    ('Fuzen Tecnologia', 'fuzen.com.br'),
    ('TechCorp Ltda', 'techcorp.com'),
    ('Inovação Digital', 'inovacaodigital.com.br');

-- Comentário: 
-- Após executar este SQL, configure as variáveis de ambiente no Supabase:
-- VITE_SUPABASE_URL = sua_url_do_supabase
-- VITE_SUPABASE_ANON_KEY = sua_chave_anonima_do_supabase