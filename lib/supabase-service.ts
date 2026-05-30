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
  email TEXT,
  status TEXT DEFAULT 'Active',
  expires TEXT,
  "limit" INTEGER DEFAULT 1,
  used INTEGER DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE,
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
  phone?: string;
  location: string;
  plan: 'Basic' | 'Professional' | 'Premium';
  status: 'Active' | 'Pending' | 'Suspended';
  mrr: number;
  logo_url?: string;
  company_id?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  notes?: string;
  trial_start_at?: string;
  trial_end_at?: string;
  trial_days?: number;
  plan_id?: string;
  registered_at?: string;
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
  email?: string;
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

// ============================================================
// PLANS
// ============================================================
export interface SaasPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_annual: number;
  max_users: number;
  max_barbers: number;
  max_services: number;
  max_bookings_per_month: number;
  features: string[];
  is_active: boolean;
  created_at?: string;
}

export async function loadSaasPlans(): Promise<SaasPlan[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('saas_plans').select('*').order('price_monthly', { ascending: true });
    if (!error && data) return data as SaasPlan[];
  } catch (err) { console.error('Erro ao carregar saas_plans:', err); }
  return [];
}

export async function saveSaasPlan(plan: SaasPlan): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_plans').upsert(plan as any);
    if (error) { console.error('Erro ao salvar saas_plan:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao salvar saas_plan:', err); return false; }
}

export async function deleteSaasPlan(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_plans').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir saas_plan:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao excluir saas_plan:', err); return false; }
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export interface SaasNotification {
  id: string;
  type: 'new_shop' | 'pending_approval' | 'trial_expiring' | 'trial_expired' | 'subscription_expired' | 'upgrade_request';
  title: string;
  message?: string;
  shop_id?: string;
  is_read: boolean;
  created_at: string;
}

export async function loadSaasNotifications(): Promise<SaasNotification[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('saas_notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (!error && data) return data as SaasNotification[];
  } catch (err) { console.error('Erro ao carregar saas_notifications:', err); }
  return [];
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_notifications').update({ is_read: true }).eq('id', id);
    if (error) { console.error('Erro ao marcar notificação:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao marcar notificação:', err); return false; }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_notifications').update({ is_read: true }).eq('is_read', false);
    if (error) { console.error('Erro ao marcar todas notificações:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao marcar todas notificações:', err); return false; }
}

// ============================================================
// AUDIT LOGS
// ============================================================
export interface SaasAuditLog {
  id: string;
  action: string;
  shop_id?: string;
  shop_name?: string;
  performed_by?: string;
  details?: Record<string, any>;
  created_at: string;
}

export async function loadSaasAuditLogs(shopId?: string): Promise<SaasAuditLog[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('saas_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (!error && data) return data as SaasAuditLog[];
  } catch (err) { console.error('Erro ao carregar saas_audit_logs:', err); }
  return [];
}

// ============================================================
// SHOP ACTIONS (via DB functions)
// ============================================================
export async function approveShop(shopId: string, adminEmail: string, trialDays = 14): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('approve_shop', { p_shop_id: shopId, p_admin_by: adminEmail, p_trial_days: trialDays });
    if (error) { console.error('Erro ao aprovar shop:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao aprovar shop:', err); return false; }
}

export async function rejectShop(shopId: string, adminEmail: string, notes?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('reject_shop', { p_shop_id: shopId, p_admin_by: adminEmail, p_notes: notes ?? null });
    if (error) { console.error('Erro ao rejeitar shop:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao rejeitar shop:', err); return false; }
}

export async function suspendShop(shopId: string, adminEmail: string, notes?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('suspend_shop', { p_shop_id: shopId, p_admin_by: adminEmail, p_notes: notes ?? null });
    if (error) { console.error('Erro ao suspender shop:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao suspender shop:', err); return false; }
}

export async function reactivateShop(shopId: string, adminEmail: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('reactivate_shop', { p_shop_id: shopId, p_admin_by: adminEmail });
    if (error) { console.error('Erro ao reativar shop:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao reativar shop:', err); return false; }
}

export async function extendTrial(shopId: string, adminEmail: string, extraDays: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('extend_trial', { p_shop_id: shopId, p_admin_by: adminEmail, p_extra_days: extraDays });
    if (error) { console.error('Erro ao estender trial:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao estender trial:', err); return false; }
}

export async function updateShopPlan(shopId: string, planId: string, adminEmail: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_shops').update({ plan_id: planId, plan: planId }).eq('id', shopId);
    if (error) { console.error('Erro ao atualizar plano:', error); return false; }
    await supabase.from('saas_audit_logs').insert({ action: 'UPDATE_PLAN', shop_id: shopId, performed_by: adminEmail, details: { plan_id: planId } });
    return true;
  } catch (err) { console.error('Exceção ao atualizar plano:', err); return false; }
}

export async function addShopNote(shopId: string, note: string, adminEmail: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('saas_shops').update({ notes: note }).eq('id', shopId);
    if (error) { console.error('Erro ao adicionar nota:', error); return false; }
    await supabase.from('saas_audit_logs').insert({ action: 'ADD_NOTE', shop_id: shopId, performed_by: adminEmail, details: { note } });
    return true;
  } catch (err) { console.error('Exceção ao adicionar nota:', err); return false; }
}

// ============================================================
// SHOP PAGES (public page config)
// ============================================================
export interface ShopPage {
  id?: string;
  company_id: string;
  slug: string;
  display_name?: string;
  description?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  contact_email?: string;
  logo_url?: string;
  cover_url?: string;
  primary_color?: string;
  secondary_color?: string;
  instagram?: string;
  facebook?: string;
  google_maps_url?: string;
  map_embed_url?: string;
  is_published?: boolean;
  working_hours?: Record<string, { open: string; close: string; active: boolean }>;
  cancellation_policy?: string;
  meta_title?: string;
  meta_description?: string;
}

export async function loadShopPage(): Promise<ShopPage | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('shop_pages').select('*').limit(1).maybeSingle();
    if (!error && data) return data as ShopPage;

    // No shop_page yet — try to auto-create from shop status
    const shopStatus = await getShopStatusForUser();
    if (!shopStatus) return null;

    const slug = shopStatus.shop_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const { data: created, error: createError } = await supabase
      .from('shop_pages')
      .upsert({ company_id: shopStatus.shop_id, slug, display_name: shopStatus.shop_name }, { onConflict: 'company_id' })
      .select()
      .maybeSingle();

    if (createError || !created) return null;
    return created as ShopPage;
  } catch (err) { console.error('Erro ao carregar shop_page:', err); return null; }
}

export async function saveShopPage(page: Partial<ShopPage> & { company_id: string }): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('shop_pages').upsert(page as any, { onConflict: 'company_id' });
    if (error) { console.error('Erro ao salvar shop_page:', error); return false; }
    return true;
  } catch (err) { console.error('Exceção ao salvar shop_page:', err); return false; }
}

export async function updateShopSlug(companyId: string, newSlug: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('update_shop_slug', { p_company_id: companyId, p_new_slug: newSlug });
    if (error) { console.error('Erro ao atualizar slug:', error); return false; }
    return data === true;
  } catch (err) { console.error('Exceção ao atualizar slug:', err); return false; }
}

// Get shop status for the currently authenticated user (for admin panel gate)
export async function getShopStatusForUser(): Promise<{
  shop_id: string; shop_name: string; status: string;
  trial_end_at: string | null; trial_days: number; plan_id: string | null;
} | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('get_shop_status_for_user');
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch (err) { console.error('Exceção ao obter status do shop:', err); return null; }
}

// ============================================================
// SUPPORT TICKETS
// ============================================================
export interface SaasTicket {
  id: string;
  shop_id?: string;
  shop_name?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: 'shop' | 'admin';
  sender_name?: string;
  body: string;
  created_at: string;
}

export async function loadSaasTickets(shopId?: string): Promise<SaasTicket[]> {
  if (!supabase) return [];
  try {
    let q = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }).limit(200);
    if (shopId) q = q.eq('shop_id', shopId);
    const { data, error } = await q;
    if (!error && data) return data as SaasTicket[];
  } catch (err) { console.error('Erro ao carregar tickets:', err); }
  return [];
}

export async function createSaasTicket(ticket: Omit<SaasTicket, 'id' | 'created_at' | 'updated_at'>): Promise<SaasTicket | null> {
  if (!supabase) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({ ...ticket, created_at: now, updated_at: now })
      .select()
      .single();
    if (!error && data) return data as SaasTicket;
  } catch (err) { console.error('Erro ao criar ticket:', err); }
  return null;
}

export async function updateTicketStatus(ticketId: string, status: SaasTicket['status']): Promise<boolean> {
  if (!supabase) return false;
  try {
    const updates: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('support_tickets').update(updates).eq('id', ticketId);
    return !error;
  } catch (err) { console.error('Erro ao atualizar status:', err); }
  return false;
}

export async function loadTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (!error && data) return data as TicketMessage[];
  } catch (err) { console.error('Erro ao carregar mensagens:', err); }
  return [];
}

export async function uploadImage(bucket: string, file: File, path: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) { console.error('Upload exception:', err); return null; }
}

export async function addTicketMessage(ticketId: string, sender: 'shop' | 'admin', body: string, senderName?: string): Promise<TicketMessage | null> {
  if (!supabase) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, sender, body, sender_name: senderName, created_at: now })
      .select()
      .single();
    if (!error && data) {
      const newStatus = sender === 'admin' ? 'in_progress' : 'open';
      await supabase.from('support_tickets')
        .update({ updated_at: now, ...(sender === 'admin' ? { status: newStatus } : {}) })
        .eq('id', ticketId);
      return data as TicketMessage;
    }
  } catch (err) { console.error('Erro ao adicionar mensagem:', err); }
  return null;
}
