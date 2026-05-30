'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  Scissors, Calendar, Users, TrendingUp, LayoutDashboard, CheckCircle2,
  ArrowRight, Star, Zap, Shield, BarChart3, Smartphone, Globe,
  ChevronRight, Menu, X, Sparkles, CreditCard, Clock, Bell,
} from 'lucide-react';

export default function SaasLandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-stone-100 font-sans antialiased overflow-x-hidden">
      <style>{`
        .amber { color: #f59e0b; }
        .amber-bg { background: #f59e0b; }
        .glow { box-shadow: 0 0 60px rgba(245,158,11,0.08); }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); transition: border-color 0.2s; }
        .card:hover { border-color: rgba(245,158,11,0.25); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .float { animation: float 4s ease-in-out infinite; }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0c]/95 backdrop-blur-md border-b border-white/5' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 md:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/barberly_logo.png" alt="Barberly" className="h-9 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[['funcionalidades','Funcionalidades'],['como-funciona','Como Funciona'],['precos','Preços']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-100 transition-colors cursor-pointer">
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => router.push('/admin')}
              className="text-xs font-bold text-stone-400 hover:text-stone-100 transition-colors px-3 py-2">
              Entrar
            </button>
            <button onClick={() => router.push('/admin')}
              className="bg-amber-500 hover:brightness-110 text-[#0a0a0c] font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/15">
              Começar Grátis <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-stone-400 hover:text-white">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0d0d0f]/95 backdrop-blur-md border-t border-white/5">
              <div className="px-5 py-5 space-y-3">
                {[['funcionalidades','Funcionalidades'],['como-funciona','Como Funciona'],['precos','Preços']].map(([id, label]) => (
                  <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm font-semibold text-stone-300 py-1.5 cursor-pointer">{label}</button>
                ))}
                <button onClick={() => router.push('/admin')}
                  className="w-full bg-amber-500 text-[#0a0a0c] font-black py-3 rounded-xl text-xs uppercase tracking-wider mt-2">
                  Começar Grátis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Hero image background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.png"
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.45) saturate(0.8)' }}
          />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #0a0a0c 38%, rgba(10,10,12,0.75) 60%, rgba(10,10,12,0.2) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0c 0%, transparent 40%)' }} />
          {/* Amber atmospheric glow */}
          <div className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 100%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-8 pt-28 pb-20 md:pt-36">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest mb-8">
              <Sparkles className="w-3 h-3" /> Plataforma SaaS para Barbearias
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Gere a sua<br />
              barbearia<br />
              <span className="text-amber-500">sem esforço</span>
            </h1>

            <p className="text-base md:text-lg text-stone-400 max-w-xl leading-relaxed mb-10">
              Software completo de gestão. Agendamentos online, controlo financeiro, gestão de equipa — tudo numa única plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <button onClick={() => router.push('/admin')}
                className="w-full sm:w-auto bg-amber-500 hover:brightness-110 text-[#0a0a0c] font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/25 transition-all active:scale-95">
                Iniciar Trial Gratuito <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => scrollTo('como-funciona')}
                className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border border-white/15 hover:bg-white/10 hover:border-white/25 text-stone-200 font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-wider transition-all">
                Ver Como Funciona
              </button>
            </div>

            {/* Stats strip */}
            <div className="flex gap-8 border-t border-white/10 pt-8">
              {[
                { value: '500+', label: 'Barbearias ativas' },
                { value: '98%', label: 'Satisfação' },
                { value: '2 min', label: 'Setup' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-black font-mono text-amber-500">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }} />
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-24 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Tudo o que precisa para gerir<br />a sua barbearia</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, title: 'Agendamentos Online', desc: 'Página pública personalizada onde os clientes agendam 24/7. Notificações automáticas, gestão de horários e disponibilidade em tempo real.' },
              { icon: Users, title: 'Gestão de Equipa', desc: 'Cadastro de barbeiros com fotos, especialidades, comissões e controlo de presença. Cada barbeiro com o seu perfil completo.' },
              { icon: BarChart3, title: 'Controlo Financeiro', desc: 'Dashboard financeiro com MRR, ARR, relatórios de receita por serviço e barbeiro. Exportação CSV incluída.' },
              { icon: Globe, title: 'Página Pública', desc: 'Landing page profissional gerada automaticamente para a sua barbearia, com logo, fotos, serviços, horários e localização.' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Interface responsiva optimizada para uso em telemóvel. Tanto para o dono como para os clientes que agendam.' },
              { icon: Shield, title: 'Multi-tenant Seguro', desc: 'Arquitectura isolada por barbearia. Dados de cada cliente completamente separados com Row Level Security no Supabase.' },
              { icon: Bell, title: 'Notificações', desc: 'Sistema de notificações para novas reservas, pagamentos, aprovações e alertas críticos em tempo real.' },
              { icon: CreditCard, title: 'Planos Flexíveis', desc: 'Planos Basic, Professional e Premium adaptados ao tamanho da barbearia. Trial gratuito incluído.' },
              { icon: Clock, title: 'Horários Inteligentes', desc: 'Configuração de horários por dia da semana com slots automáticos. Evita conflitos de agendamento.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-100 mb-2">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-24 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Como Funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16">Em 3 passos está operacional</h2>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { step: '01', icon: Zap, title: 'Registe a sua barbearia', desc: 'Crie a sua conta, configure o perfil da barbearia, adicione logo, cores e informações de contacto em minutos.' },
              { step: '02', icon: Users, title: 'Adicione a sua equipa', desc: 'Cadastre os barbeiros com fotos e especialidades. Crie os serviços com preços e vincule-os a cada barbeiro.' },
              { step: '03', icon: TrendingUp, title: 'Comece a receber reservas', desc: 'A sua página pública fica automaticamente online. Partilhe o link e comece a receber agendamentos.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 block mb-1">{step}</span>
                    <h3 className="font-bold text-stone-100 mb-2">{title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precos" className="py-24 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Planos para todos os tamanhos</h2>
            <p className="text-stone-400 text-sm">14 dias de trial gratuito. Sem cartão de crédito.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Basic',
                price: 29,
                desc: 'Para barbeiros independentes',
                features: ['1 barbeiro', 'Agendamentos ilimitados', 'Página pública', 'Suporte por email'],
                cta: 'Começar Trial',
                featured: false,
              },
              {
                name: 'Professional',
                price: 89,
                desc: 'Para barbearias em crescimento',
                features: ['Até 5 barbeiros', 'Analytics avançado', 'Multi-localização', 'Suporte prioritário', 'Gestão financeira'],
                cta: 'Começar Trial',
                featured: true,
              },
              {
                name: 'Premium',
                price: 249,
                desc: 'Para grandes operações',
                features: ['Barbeiros ilimitados', 'API access', 'White-label', 'Gestor de conta dedicado', 'SLA 99.9%'],
                cta: 'Falar com Vendas',
                featured: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-7 flex flex-col justify-between ${plan.featured ? 'bg-amber-500/8 border border-amber-500/30 shadow-2xl shadow-amber-500/5' : 'card'}`}>
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-[#0a0a0c] text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                    Mais Popular
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-stone-100 mb-1">{plan.name}</h3>
                  <p className="text-xs text-stone-500 mb-5">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black font-mono text-white">€{plan.price}</span>
                    <span className="text-stone-500 text-xs font-bold ml-1">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-7">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-stone-400">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => router.push('/admin')}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${plan.featured ? 'bg-amber-500 hover:brightness-110 text-[#0a0a0c] shadow-lg shadow-amber-500/20' : 'border border-white/10 hover:border-white/20 text-stone-300 hover:text-white'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-500 mb-12">Barbearias que confiam no BarberPro</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Carlos Mendes', shop: 'BarberKing Lisboa', text: 'Antes usava papel para anotar agendamentos. Agora os clientes agendam sozinhos e eu só apareço para cortar.', stars: 5 },
              { name: 'Tiago Ferreira', shop: 'Studio Urban Porto', text: 'A página pública ficou incrível. Recebi mensagens de novos clientes no primeiro dia de uso.', stars: 5 },
              { name: 'Pedro Almeida', shop: 'Classic Cut Braga', text: 'O controlo financeiro mudou tudo. Sei exatamente quanto cada barbeiro fatura e qual serviço rende mais.', stars: 5 },
            ].map(({ name, shop, text, stars }) => (
              <div key={name} className="card rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array(stars).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />)}
                </div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">"{text}"</p>
                <div>
                  <p className="text-sm font-bold text-stone-200">{name}</p>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{shop}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-6 float">
            <Scissors className="w-7 h-7" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronto para modernizar<br />a sua barbearia?</h2>
          <p className="text-stone-400 mb-8">14 dias grátis, sem cartão de crédito. Configure em menos de 2 minutos.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push('/admin')}
              className="bg-amber-500 hover:brightness-110 text-[#0a0a0c] font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 transition-all">
              Começar Trial Gratuito <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/admin')}
              className="border border-white/10 hover:border-white/20 text-stone-300 font-bold px-8 py-4 rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
              <LayoutDashboard className="w-4 h-4" /> Entrar no Painel
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-5 md:px-8 bg-[#07070a]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/barberly_logo.png" alt="Barberly" className="h-7 w-auto object-contain opacity-60"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-stone-700 text-xs">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            {['Privacidade','Termos','Contacto'].map(l => (
              <a key={l} href="#" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-[10px] text-stone-700">Feito com ♥ para barbearias</p>
        </div>
      </footer>
    </div>
  );
}
