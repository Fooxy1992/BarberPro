'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  User,
  Shield,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  UserCheck,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Super admin email — must match NEXT_PUBLIC_SUPER_ADMIN_EMAIL env var
const SUPER_ADMIN_EMAIL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.trim().toLowerCase()) ||
  'superadmin@barberpro.com';

interface AuthOverlayProps {
  targetView: 'dashboard' | 'superadmin';
  onSuccess: (user: any) => void;
  onCancel: () => void;
  triggerToast: (msg: string) => void;
}

export function AuthOverlay({ targetView, onSuccess, onCancel, triggerToast }: AuthOverlayProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'gerente' | 'barbeiro'>('barbeiro');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ensureSupabaseClient = () => {
    if (!supabase) {
      throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return supabase;
  };

  // Auto-create and sign in a demo account on-the-fly
  const handleDemoSignIn = async (demoRole: 'gerente' | 'barbeiro') => {
    setIsSubmitting(true);
    const demoEmail = `${demoRole}@barberpro.com`;
    // Demo password comes from env var — never hardcode in source
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';
    const demoName = demoRole === 'gerente' ? 'Gerente Demo' : 'Barbeiro Demo';

    if (!demoPassword) {
      triggerToast('Demo indisponível: defina NEXT_PUBLIC_DEMO_PASSWORD no .env.');
      setIsSubmitting(false);
      return;
    }

    try {
      const client = ensureSupabaseClient();

      const { data, error } = await client.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('User not found') ||
          error.message.includes('Email not confirmed')
        ) {
          triggerToast(`Criando conta demonstrativa de "${demoRole}" em tempo real...`);

          const { error: signUpError } = await client.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: { raw_name: demoName, role: demoRole },
            },
          });

          if (signUpError) throw signUpError;

          const { data: retryData, error: retryError } = await client.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

          if (retryError) throw retryError;

          triggerToast(`Sandbox: Logado como ${demoRole === 'gerente' ? 'Gerente' : 'Barbeiro'}!`);
          onSuccess(retryData.user);
        } else {
          throw error;
        }
      } else {
        triggerToast(`Sandbox: Acesso concedido como ${demoRole === 'gerente' ? 'Gerente' : 'Barbeiro'}!`);
        onSuccess(data.user);
      }
    } catch (err: any) {
      triggerToast(`Falha na autenticação demo: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill super admin email on the login form (user must type their own password)
  const handleSuperAdminDemoSignIn = () => {
    setEmail(SUPER_ADMIN_EMAIL);
    triggerToast('Email de Super Admin preenchido. Digite a sua senha para entrar.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const client = ensureSupabaseClient();

      if (activeTab === 'login') {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        triggerToast('Autenticação realizada com sucesso!');
        onSuccess(data.user);
      } else {
        if (!fullName) {
          triggerToast('Por favor, digite seu nome completo para cadastro.');
          setIsSubmitting(false);
          return;
        }

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { raw_name: fullName, role },
          },
        });

        if (error) throw error;

        if (data.session) {
          triggerToast('Conta criada e logada com sucesso!');
          onSuccess(data.user);
        } else {
          triggerToast('Cadastro efetuado! Caso seja necessário, verifique seu email.');
          setActiveTab('login');
        }
      }
    } catch (err: any) {
      triggerToast(`Erro: ${err.message || 'Houve uma falha inesperada.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdminView = targetView === 'superadmin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#111110] border border-white/5 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer group uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar ao site
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex p-3 rounded-full border ${isSuperAdminView ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
            {isSuperAdminView ? <Shield className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6 animate-pulse" />}
          </div>
          <h2 className="font-serif text-2xl text-white font-medium">
            {isSuperAdminView ? 'Acesso Super Admin SaaS' : 'Painel Administrativo'}
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed max-w-sm mx-auto">
            {isSuperAdminView
              ? 'Zona restrita exclusiva para o administrador da plataforma '
              : 'Zona restrita para barbeiros e gerentes credenciados do '}
            <span className="text-amber-500 font-bold">BarberPro</span>.
          </p>
        </div>

        {/* Super admin info box */}
        {isSuperAdminView && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center space-y-1">
            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Acesso Restrito</p>
            <p className="text-[11px] text-stone-400">Use as credenciais de Super Admin configuradas no sistema.</p>
          </div>
        )}

        {/* Tab switcher — hidden for super admin (login only) */}
        {!isSuperAdminView && (
          <div className="flex bg-neutral-950/80 p-1 border border-white/5 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === 'login'
                  ? 'bg-[#1c1c1a] text-white border border-white/5 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === 'register'
                  ? 'bg-[#1c1c1a] text-white border border-white/5 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Cadastrar-se
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && !isSuperAdminView && (
            <div className="space-y-1.5 text-left">
              <label className="block text-stone-300 text-xs font-bold uppercase tracking-wider">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="block text-stone-300 text-xs font-bold uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                placeholder={isSuperAdminView ? SUPER_ADMIN_EMAIL : 'Ex: profissional@barberpro.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-stone-300 text-xs font-bold uppercase tracking-wider">
              Senha de acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 rounded transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {activeTab === 'register' && !isSuperAdminView && (
            <div className="space-y-2 text-left">
              <label className="block text-stone-300 text-xs font-bold uppercase tracking-wider">
                Cargo / Perfil
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('barbeiro')}
                  className={`flex items-center justify-center gap-2 py-3 border rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                    role === 'barbeiro'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-neutral-950/40 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Barbeiro
                </button>
                <button
                  type="button"
                  onClick={() => setRole('gerente')}
                  className={`flex items-center justify-center gap-2 py-3 border rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                    role === 'gerente'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-neutral-950/40 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Gerente / Admin
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-xl shadow-amber-500/5 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : activeTab === 'login' || isSuperAdminView ? (
              'Entrar no Sistema'
            ) : (
              'Salvar Credenciais'
            )}
          </button>
        </form>

        {/* Quick Access Panel */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider text-center">
            Acesso Rápido — Sandbox (Supabase Auth)
          </p>

          {isSuperAdminView ? (
            /* Super admin: single demo button */
            <button
              onClick={handleSuperAdminDemoSignIn}
              disabled={isSubmitting}
              className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-[10px] font-bold uppercase tracking-wider rounded-lg text-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Preencher email de Super Admin"
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              Preencher Email Admin
            </button>
          ) : (
            /* Dashboard: gerente + barbeiro demo buttons */
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDemoSignIn('gerente')}
                disabled={isSubmitting}
                className="py-2 px-3 bg-[#181817] hover:bg-[#20201f] border border-white/5 hover:border-amber-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg text-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Entrar como Gerente Demo"
              >
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Demo Gerente
              </button>
              <button
                onClick={() => handleDemoSignIn('barbeiro')}
                disabled={isSubmitting}
                className="py-2 px-3 bg-[#181817] hover:bg-[#20201f] border border-white/5 hover:border-amber-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg text-stone-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Entrar como Barbeiro Demo"
              >
                <UserCheck className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                Demo Barbeiro
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface AccessDeniedViewProps {
  requiredRoles: ('gerente' | 'barbeiro')[];
  onBack: () => void;
  triggerToast: (msg: string) => void;
}

export function AccessDeniedView({ requiredRoles, onBack, triggerToast }: AccessDeniedViewProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (!supabase) {
        triggerToast('Supabase não configurado. Não há sessão ativa para encerrar.');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      triggerToast('Sessão encerrada com sucesso!');
    } catch (err: any) {
      triggerToast(`Erro ao sair: ${err.message || err}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111110] border border-red-500/10 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 text-center"
      >
        <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-white font-medium">Acesso Restrito</h3>
          <p className="text-stone-400 text-xs leading-relaxed">
            Seu perfil atual não possui privilégios suficientes para acessar esta página.
          </p>
          <div className="bg-neutral-950 p-2 border border-white/5 rounded-lg text-left">
            <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-widest text-center">Permissões Requeridas</span>
            <span className="block text-xs font-mono text-amber-500 text-center uppercase tracking-wider mt-1">
              {requiredRoles.join(' / ')}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-[#181817] hover:bg-[#20201f] text-stone-300 hover:text-white border border-white/5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Site
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 text-center"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              'Trocar de Conta'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
