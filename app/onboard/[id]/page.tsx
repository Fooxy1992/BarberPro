'use client';

import React, { useState } from 'react';
import { Scissors, CheckCircle2, User, Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useParams, useRouter } from 'next/navigation';

export default function OnboardPage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.id as string;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0d0d0c] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111110] border border-white/5 p-8 rounded-2xl max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif text-stone-100 mb-2">Registo Concluído!</h2>
          <p className="text-stone-400 text-sm mb-6">A sua barbearia foi configurada com sucesso. Redirecionando para o login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0c] flex items-center justify-center p-4 font-sans text-stone-300">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Info Panel */}
        <div className="hidden md:flex flex-col justify-center space-y-8 p-8">
          <div className="flex items-center gap-3 text-amber-500">
            <Scissors className="w-8 h-8" />
            <span className="text-2xl font-black tracking-widest uppercase">BarberPro</span>
          </div>
          
          <div>
            <h1 className="text-4xl font-serif text-stone-100 mb-4 leading-tight">Bem-vindo à plataforma de gestão premium.</h1>
            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              Você foi convidado com o código exclusivo <span className="text-amber-500 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded">{inviteId}</span>.  
              Preencha o formulário ao lado para ativar o seu tenant isolado.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-stone-400 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">Tenant Isolado</h4>
                <p className="text-xs text-stone-500 mt-1">Dados 100% seguros e separados das outras lojas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-stone-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">Setup Automático</h4>
                <p className="text-xs text-stone-500 mt-1">Ambiente de sistema configurado num clique.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="bg-[#111110] border border-white/5 p-8 rounded-3xl shadow-2xl relative">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Onboarding de Parceiro</span>
            <h2 className="text-2xl font-serif text-stone-100">Ativação da Conta</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider ml-1">Nome da Barbearia</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Store className="h-4 w-4 text-stone-600" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full bg-[#0a0a09] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="Vintage Barbershop..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider ml-1">Nome do Proprietário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-stone-600" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-[#0a0a09] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider ml-1">Email Profissional</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-stone-600" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0a0a09] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="gestao@barbearia.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-600" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0a0a09] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="********"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black py-4 flex flex-row items-center justify-center gap-2 rounded-xl text-sm uppercase tracking-wider transition-all mt-6"
            >
              {isSubmitting ? (
                <span className="opacity-70">Processando...</span>
              ) : (
                <>
                  Criar Barbearia <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
            <p className="text-[10px] text-stone-600 text-center mt-4">
              Ao criar a conta, você concorda com os Termos de Serviço da plataforma SaaS BarberPro.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
