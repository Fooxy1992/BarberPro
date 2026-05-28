-- CRIAÇÃO DAS TABELAS PARA O PAINEL SUPER ADMIN SAAS
-- Estas tabelas armazenam dados globais da plataforma (não são multi-tenant)

-- 1. Tabela de Barbearias Registradas no SaaS
CREATE TABLE IF NOT EXISTS saas_shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  mrr NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Cupons Promocionais
CREATE TABLE IF NOT EXISTS saas_coupons (
  code TEXT PRIMARY KEY,
  discount TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  expiry TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Convites de Onboarding
CREATE TABLE IF NOT EXISTS saas_invites (
  id TEXT PRIMARY KEY,
  link TEXT NOT NULL,
  status TEXT NOT NULL,
  expires TEXT NOT NULL,
  "limit" INTEGER DEFAULT 1,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas tabelas SaaS
ALTER TABLE saas_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invites ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS PARA SUPER ADMIN
-- Apenas o super admin (superadmin@barberpro.com) pode acessar estas tabelas

-- Função para verificar se o usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'superadmin@barberpro.com'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas para saas_shops
DROP POLICY IF EXISTS "Super admin pode ler shops" ON saas_shops;
CREATE POLICY "Super admin pode ler shops" ON saas_shops FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode inserir shops" ON saas_shops;
CREATE POLICY "Super admin pode inserir shops" ON saas_shops FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode atualizar shops" ON saas_shops;
CREATE POLICY "Super admin pode atualizar shops" ON saas_shops FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode deletar shops" ON saas_shops;
CREATE POLICY "Super admin pode deletar shops" ON saas_shops FOR DELETE USING (is_super_admin());

-- Políticas para saas_coupons
DROP POLICY IF EXISTS "Super admin pode ler coupons" ON saas_coupons;
CREATE POLICY "Super admin pode ler coupons" ON saas_coupons FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode inserir coupons" ON saas_coupons;
CREATE POLICY "Super admin pode inserir coupons" ON saas_coupons FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode atualizar coupons" ON saas_coupons;
CREATE POLICY "Super admin pode atualizar coupons" ON saas_coupons FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode deletar coupons" ON saas_coupons;
CREATE POLICY "Super admin pode deletar coupons" ON saas_coupons FOR DELETE USING (is_super_admin());

-- Políticas para saas_invites
DROP POLICY IF EXISTS "Super admin pode ler invites" ON saas_invites;
CREATE POLICY "Super admin pode ler invites" ON saas_invites FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode inserir invites" ON saas_invites;
CREATE POLICY "Super admin pode inserir invites" ON saas_invites FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode atualizar invites" ON saas_invites;
CREATE POLICY "Super admin pode atualizar invites" ON saas_invites FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin pode deletar invites" ON saas_invites;
CREATE POLICY "Super admin pode deletar invites" ON saas_invites FOR DELETE USING (is_super_admin());
