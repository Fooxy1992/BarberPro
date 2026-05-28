-- CRIAÇÃO DO BANCO DE DADOS REAL PARA O BARBERPRO SAAS
-- Arquitetura Multi-Tenant: Cada barbearia tem seu próprio ambiente isolado (company_id)

-- 1. Tabela de Empresas (Barbearias)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Perfis de Usuário (Vínculo Auth -> Empresa)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY, -- Mapeia direto para auth.users.id
  company_id UUID REFERENCES companies(id) NOT NULL,
  role TEXT DEFAULT 'barbeiro',
  raw_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  sales INTEGER DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  "loyaltyPoints" INTEGER DEFAULT 0,
  "lastVisit" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Barbeiros
CREATE TABLE IF NOT EXISTS barbers (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  room TEXT,
  status TEXT DEFAULT 'Livre',
  rating NUMERIC DEFAULT 5.0,
  "reviewsCount" INTEGER DEFAULT 0,
  "avatarUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  duration TEXT,
  price NUMERIC,
  description TEXT,
  "iconKey" TEXT DEFAULT 'scissors',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Agendamentos (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  time TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  price NUMERIC,
  status TEXT DEFAULT 'Confirmado',
  "avatarUrl" TEXT,
  "barberId" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Transações de Caixa (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Estoque (Stock Items)
CREATE TABLE IF NOT EXISTS stock_items (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  quantity INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO: Obter o ID da Empresa baseado no Usuário Logado (Auth)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- FUNÇÃO: Garantir inserções para a empresa correta (Gatilho)
CREATE OR REPLACE FUNCTION set_company_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := get_user_company_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATRIBUIR GATILHO ÀS TABELAS PARA AUTO-INJETAR COMPANY_ID
CREATE TRIGGER ensure_company_id_clients BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();
CREATE TRIGGER ensure_company_id_barbers BEFORE INSERT ON barbers FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();
CREATE TRIGGER ensure_company_id_services BEFORE INSERT ON services FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();
CREATE TRIGGER ensure_company_id_appointments BEFORE INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();
CREATE TRIGGER ensure_company_id_transactions BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();
CREATE TRIGGER ensure_company_id_stock_items BEFORE INSERT ON stock_items FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert();

-- POLÍTICAS RLS (Row Level Security) - Isolamento de Multi-Tenant
-- companies: O usuário pode ver a empresa dele e criar novas
CREATE POLICY "Leitura de empresa" ON companies FOR SELECT USING (id = get_user_company_id());
CREATE POLICY "Criacao de empresa" ON companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Atualizacao de empresa" ON companies FOR UPDATE USING (id = get_user_company_id()) WITH CHECK (id = get_user_company_id());

-- user_profiles: O usuário pode gerenciar seu próprio perfil
CREATE POLICY "Leitura do proprio perfil" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Criacao de perfil" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Atualizacao de perfil" ON user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- FUNÇÃO E GATILHO PARA ONBOARDING MULTI-TENANT (SUPABASE AUTH)
-- Quando um novo usuário se cadastrar pelo Auth, cria uma empresa isolada para ele e um perfil.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- 1. Criar uma nova empresa/tenant baseada no nome do usuário
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'raw_name', 'Minha Barbearia') || ' - Workspace')
  RETURNING id INTO new_company_id;

  -- 2. Criar o perfil do usuário vinculado à nova empresa
  INSERT INTO public.user_profiles (id, company_id, role, raw_name)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'gerente'),
    COALESCE(NEW.raw_user_meta_data->>'raw_name', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger se existir antes de criar novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Dados (Isolamento por company_id)
CREATE POLICY "Isolamento Clientes" ON clients FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Isolamento Barbeiros" ON barbers FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Isolamento Servicos" ON services FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Isolamento Agendamentos" ON appointments FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Isolamento Transacoes" ON transactions FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY "Isolamento Estoque" ON stock_items FOR ALL USING (company_id = get_user_company_id());
