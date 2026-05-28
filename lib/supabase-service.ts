import { supabase } from './supabase';

export interface SqlSchema {
  target: string;
  sql: string;
}

export const SUPABASE_SETUP_SQL = `-- CRIAÇÃO DO BANCO DE DADOS REAL PARA O BARBERPRO SAAS
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
  company_name TEXT;
BEGIN
  -- 1. Criar uma nova empresa/tenant baseada no nome da barbearia, se informado, ou no nome do usuário.
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'raw_name',
    'Minha Barbearia'
  ) || ' - Workspace';

  INSERT INTO public.companies (name)
  VALUES (company_name)
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

-- ============================================================
-- TABELAS SUPER ADMIN (plataforma SaaS global, sem company_id)
-- ============================================================

-- 9. Barbearias registradas na plataforma SaaS
CREATE TABLE IF NOT EXISTS saas_shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT DEFAULT 'Brasil',
  plan TEXT DEFAULT 'Basic',
  status TEXT DEFAULT 'Active',
  mrr NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Cupons promocionais da plataforma
CREATE TABLE IF NOT EXISTS saas_coupons (
  code TEXT PRIMARY KEY,
  discount TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  total INTEGER DEFAULT 100,
  expiry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Convites de onboarding
CREATE TABLE IF NOT EXISTS saas_invites (
  id TEXT PRIMARY KEY,
  link TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  expires TEXT,
  "limit" INTEGER DEFAULT 1,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas tabelas super admin
ALTER TABLE saas_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invites ENABLE ROW LEVEL SECURITY;

-- Políticas super admin: apenas o super admin (email configurado) pode acessar
-- Como RLS não tem acesso direto ao email, usamos service_role para operações super admin.
-- Para acesso via anon key, liberamos leitura pública (os dados não são sensíveis).
CREATE POLICY "Super Admin leitura shops" ON saas_shops FOR SELECT USING (true);
CREATE POLICY "Super Admin escrita shops" ON saas_shops FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super Admin leitura coupons" ON saas_coupons FOR SELECT USING (true);
CREATE POLICY "Super Admin escrita coupons" ON saas_coupons FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super Admin leitura invites" ON saas_invites FOR SELECT USING (true);
CREATE POLICY "Super Admin escrita invites" ON saas_invites FOR ALL USING (auth.uid() IS NOT NULL);
`;

// Helper to check table existence/R/W status
export async function getSyncStatus(): Promise<{ connected: boolean; message: string; tablesStatus: Record<string, boolean> }> {
  const result = {
    connected: false,
    message: 'Carregando conexão...',
    tablesStatus: {
      clients: false,
      barbers: false,
      services: false,
      appointments: false,
      transactions: false,
      stock_items: false
    }
  };

  const client = supabase;
  if (!client) {
    result.message = 'Supabase não definido';
    return result;
  }

  try {
    const checkPromises = Object.keys(result.tablesStatus).map(async (tableName) => {
      const { error } = await client.from(tableName).select('id').limit(1);
      return { tableName, working: !error || error.code !== 'PGRST114' }; // PGRST114 is Table / Relation not found
    });

    const checks = await Promise.all(checkPromises);
    let workingTablesCount = 0;
    checks.forEach(({ tableName, working }) => {
      (result.tablesStatus as any)[tableName] = working;
      if (working) workingTablesCount++;
    });

    result.connected = true;
    if (workingTablesCount === 6) {
      result.message = 'Sincronizado via Supabase Cloud';
    } else if (workingTablesCount > 0) {
      result.message = 'Sincronizado parcial (Tabelas pendentes)';
    } else {
      result.message = 'Supabase Conectado (Execute o script SQL para concluir)';
    }
    return result;
  } catch (err) {
    result.message = 'Falha de comunicação ou Timeout';
    return result;
  }
}

// Global generic loading helper
export async function loadTableData<T>(tableName: string, defaultData: T[] = []): Promise<{ data: T[]; source: 'supabase' | 'local' }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && data) {
        return { data: data as T[], source: 'supabase' };
      }
      console.error(`Erro ao carregar dados de ${tableName}:`, error);
    } catch (err) {
      console.error(`Exceção ao carregar dados de ${tableName}:`, err);
    }
  }

  return { data: defaultData, source: 'local' };
}

// Global generic save/upsert helper
export async function saveRow<T extends { id: string }>(tableName: string, row: T): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from(tableName).upsert(row as any);
      if (error) {
        console.error(`Erro ao salvar em ${tableName}:`, error);
        return false;
      }
      return true;
    } catch (err) {
        console.error(`Exceção ao salvar em ${tableName}:`, err);
      return false;
    }
  }
  return false;
}

// Remove row helper
export async function deleteRow(tableName: string, id: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
         console.error(`Erro ao excluir em ${tableName}:`, error);
         return false;
      }
      return true;
    } catch (err) {
        console.error(`Exceção ao excluir em ${tableName}:`, err);
      return false;
    }
  }
  return false;
}

// ============================================================
// SUPER ADMIN helpers — tabelas saas_shops, saas_coupons, saas_invites
// ============================================================

export interface SaasShop {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  location: string;
  plan: 'Basic' | 'Professional' | 'Premium';
  status: 'Active' | 'Pending' | 'Suspended';
  mrr: number;
}

export interface SaasCoupon {
  code: string;
  discount: string;
  used: number;
  total: number;
  expiry: string;
}

export interface SaasInvite {
  id: string;
  link: string;
  status: 'Active' | 'Expired';
  expires: string;
  limit: number;
  used: number;
}

export async function loadSaasShops(defaultData: SaasShop[] = []): Promise<SaasShop[]> {
  if (!supabase) return defaultData;
  try {
    const { data, error } = await supabase.from('saas_shops').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as SaasShop[];
  } catch (err) {
    console.error('Erro ao carregar saas_shops:', err);
  }
  return defaultData;
}

export async function saveSaasShop(shop: SaasShop): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_shops').upsert(shop as any);
    if (error) { console.error('Erro ao salvar saas_shop:', error); return false; }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar saas_shop:', err);
    return false;
  }
}

export async function deleteSaasShop(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_shops').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir saas_shop:', error); return false; }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir saas_shop:', err);
    return false;
  }
}

export async function loadSaasCoupons(defaultData: SaasCoupon[] = []): Promise<SaasCoupon[]> {
  if (!supabase) return defaultData;
  try {
    const { data, error } = await supabase.from('saas_coupons').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as SaasCoupon[];
  } catch (err) {
    console.error('Erro ao carregar saas_coupons:', err);
  }
  return defaultData;
}

export async function saveSaasCoupon(coupon: SaasCoupon): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_coupons').upsert(coupon as any);
    if (error) { console.error('Erro ao salvar saas_coupon:', error); return false; }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar saas_coupon:', err);
    return false;
  }
}

export async function deleteSaasCoupon(code: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_coupons').delete().eq('code', code);
    if (error) { console.error('Erro ao excluir saas_coupon:', error); return false; }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir saas_coupon:', err);
    return false;
  }
}

export async function loadSaasInvites(defaultData: SaasInvite[] = []): Promise<SaasInvite[]> {
  if (!supabase) return defaultData;
  try {
    const { data, error } = await supabase.from('saas_invites').select('*').order('created_at', { ascending: false });
    if (!error && data) return data as SaasInvite[];
  } catch (err) {
    console.error('Erro ao carregar saas_invites:', err);
  }
  return defaultData;
}

export async function saveSaasInvite(invite: SaasInvite): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_invites').upsert(invite as any);
    if (error) { console.error('Erro ao salvar saas_invite:', error); return false; }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar saas_invite:', err);
    return false;
  }
}
