'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Scissors,
  LayoutDashboard,
  Store,
  CreditCard,
  TrendingUp,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Download,
  Users,
  Headphones,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  MoreVertical,
  Star,
  Check,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Percent,
  Calendar,
  MessageSquare,
  Shield,
  FileText,
  Send,
  HelpCircle,
  LifeBuoy
} from 'lucide-react';

interface SuperAdminViewsProps {
  onBackToMain: () => void;
  triggerToast: (msg: string) => void;
}

// Interfaces
interface Shop {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  location: string;
  plan: 'Basic' | 'Professional' | 'Premium';
  status: 'Active' | 'Pending' | 'Suspended';
  mrr: number;
}

interface Coupon {
  code: string;
  discount: string;
  used: number;
  total: number;
  expiry: string;
}

interface Ticket {
  id: string;
  priority: 'High' | 'Normal' | 'Low';
  time: string;
  title: string;
  lastMessage: string;
  shopName: string;
  shopShort: string;
  status: 'In Progress' | 'Open' | 'Resolved';
  messages: { sender: 'shop' | 'admin'; text: string; time: string }[];
}

export function SuperAdminView({ onBackToMain, triggerToast }: SuperAdminViewsProps) {
  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shops' | 'subscriptions' | 'invites' | 'revenue' | 'support' | 'logs' | 'users' | 'settings' | 'monitor'>('dashboard');
  
  // Settings view sub-tab
  const [settingsTab, setSettingsTab] = useState<'general' | 'security' | 'billing' | 'notifications'>('general');

  // --- STATE FOR SHOPS ---
  const [shops, setShops] = useState<Shop[]>([
    {
      id: 'BP-7822',
      name: 'The Golden Blade',
      ownerName: 'Marcus Sterling',
      email: 'm.sterling@blade.com',
      location: 'London, UK',
      plan: 'Premium',
      status: 'Active',
      mrr: 249.00
    },
    {
      id: 'BP-4412',
      name: 'Precision Cuts',
      ownerName: 'Elena Rodriguez',
      email: 'e.rodriguez@precision.io',
      location: 'Madrid, ES',
      plan: 'Professional',
      status: 'Pending',
      mrr: 149.00
    },
    {
      id: 'BP-1099',
      name: 'Urban Fade Studio',
      ownerName: 'Jordan Banks',
      email: 'jordan@urbanfade.com',
      location: 'New York, US',
      plan: 'Basic',
      status: 'Suspended',
      mrr: 49.00
    },
    {
      id: 'BP-3321',
      name: 'Heritage Grooming',
      ownerName: 'Arthur Shelby',
      email: 'arthur@heritage.co',
      location: 'Berlin, DE',
      plan: 'Premium',
      status: 'Active',
      mrr: 249.00
    }
  ]);

  const [searchShop, setSearchShop] = useState('');
  const [filterPlan, setFilterPlan] = useState<'All' | 'Basic' | 'Professional' | 'Premium'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Pending' | 'Suspended'>('All');
  
  // Create Shop Dialog State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    ownerName: '',
    email: '',
    location: '',
    plan: 'Premium' as 'Basic' | 'Professional' | 'Premium',
    status: 'Active' as 'Active' | 'Pending' | 'Suspended',
    mrr: '249.00'
  });

  // --- STATE FOR PLANS & SUBSCRIPTIONS ---
  const [plans, setPlans] = useState({
    artisanSolo: {
      price: 29,
      barberSeats: 1,
      appointments: '200',
      analytics: true,
      sms: true,
      multiLocation: false,
      activeCount: 1240
    },
    studioMaster: {
      price: 89,
      barberSeats: 5,
      appointments: 'Ilimitado',
      analytics: true,
      sms: true,
      multiLocation: true,
      activeCount: 980
    }
  });

  const [coupons, setCoupons] = useState<Coupon[]>([
    { code: 'GOLDEN20', discount: '20% OFF', used: 412, total: 500, expiry: '12/26' },
    { code: 'LAUNCH50', discount: '€50 FILET', used: 88, total: 100, expiry: '08/26' }
  ]);
  const [isNewCouponOpen, setIsNewCouponOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '20% OFF', total: 100, expiry: '12/26' });

  // --- STATE FOR SUPPORT TICKETS ---
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'T-8842',
      priority: 'High',
      time: '14:20 PM',
      title: 'Problema com Sincronização de PDV',
      lastMessage: 'A luz de status está piscando em dourado agora... aguardando prontidão.',
      shopName: 'Vintage Studio Soho',
      shopShort: 'VS',
      status: 'In Progress',
      messages: [
        { sender: 'shop', text: 'Olá equipe! Nosso terminal de PDV (Unidade #04) não está sincronizando com o painel principal. Temos 4 clientes aguardando e não podemos processar pagamentos digitais. Tentamos reiniciar, mas não funcionou. Ajuda!', time: '14:20 PM' },
        { sender: 'admin', text: 'Olá Marcus, sou Alexandre da equipe técnica. Consigo visualizar um atraso de sincronização na Unidade #04. Estou forçando a limpeza de cache do banco de dados agora. Pode verificar se a luz "Online" fica dourada em 30 segundos?', time: '14:28 PM' },
        { sender: 'shop', text: 'A luz de status está piscando em dourado agora... ainda aguardando a mensagem "Pronto".', time: '14:32 PM' }
      ]
    },
    {
      id: 'T-8810',
      priority: 'Normal',
      time: 'Ontem',
      title: 'Dúvida sobre Upgrade de Assinatura',
      lastMessage: 'Gostaria de saber se o plano Elite inclui faturamento multiloja?',
      shopName: 'The Cut Lab',
      shopShort: 'TC',
      status: 'Open',
      messages: [
        { sender: 'shop', text: 'Gostaria de saber se o plano Elite inclui o sistema de faturamento e cartões fidelidade de controle multiloja? Estamos expandindo para uma segunda barbearia.', time: 'Ontem' }
      ]
    },
    {
      id: 'T-8798',
      priority: 'Low',
      time: '2 dias atrás',
      title: 'Atualização de galeria de fotos',
      lastMessage: 'O limite de fotos na URL do CRM retornou sucesso.',
      shopName: 'Royal Barber Co.',
      shopShort: 'RB',
      status: 'Resolved',
      messages: [
        { sender: 'shop', text: 'Podemos carregar imagens em massa para o nosso portfólio? O limite atual de 5 fotos parece curto para exibir todo o staff.', time: '2 dias atrás' },
        { sender: 'admin', text: 'Olá! Aumentei temporariamente o limite de upload para 15 imagens no seu perfil premium. Por favor, tente novamente.', time: 'Ontem' },
        { sender: 'shop', text: 'Excelente! Consegui carregar todas elas perfeitamente agora. Obrigado pelo suporte rápido!', time: 'Ontem' }
      ]
    }
  ]);

  const [activeTicketId, setActiveTicketId] = useState('T-8842');
  const [replyMessage, setReplyMessage] = useState('');

  // --- STATE FOR PLATFORM SETTINGS ---
  const [platformConfig, setPlatformConfig] = useState({
    name: 'BarberPro SaaS',
    email: 'ops@barberpro.io',
    description: 'A plataforma de gerenciamento de alta performance líder mundial para barbearias premium e estúdios de estética.',
    mfaEnabled: true,
    sessionTimeout: '30 Minutes',
    stripeConnected: true
  });

  // --- STATE FOR INVITES ---
  const [invites, setInvites] = useState<Array<{
    id: string;
    link: string;
    status: 'Active' | 'Expired';
    expires: string;
    limit: number;
    used: number;
  }>>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Derived properties for stats summary
  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchSearch = shop.name.toLowerCase().includes(searchShop.toLowerCase()) ||
                          shop.ownerName.toLowerCase().includes(searchShop.toLowerCase()) ||
                          shop.id.toLowerCase().includes(searchShop.toLowerCase());
      const matchPlan = filterPlan === 'All' || shop.plan === filterPlan;
      const matchStatus = filterStatus === 'All' || shop.status === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [shops, searchShop, filterPlan, filterStatus]);

  const stats = useMemo(() => {
    const totalCount = shops.length;
    let mrrSum = shops.reduce((sum, shop) => sum + (shop.status === 'Active' ? shop.mrr : 0), 0);
    return {
      totalShops: totalCount,
      mrr: mrrSum
    };
  }, [shops]);

  const currentActiveTicket = useMemo(() => {
    return tickets.find(t => t.id === activeTicketId) || tickets[0];
  }, [tickets, activeTicketId]);

  // Actions handler
  const handleRegisterShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShop.name || !newShop.ownerName || !newShop.email) {
      triggerToast('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    const newId = `BP-${Math.floor(1000 + Math.random() * 9000)}`;
    const shopToAdd: Shop = {
      id: newId,
      name: newShop.name,
      ownerName: newShop.ownerName,
      email: newShop.email,
      location: newShop.location || 'Brasil',
      plan: newShop.plan,
      status: newShop.status,
      mrr: parseFloat(newShop.mrr) || 0
    };
    setShops([shopToAdd, ...shops]);
    setIsRegisterModalOpen(false);
    triggerToast(`Barbearia "${newShop.name}" registrada com sucesso e ativa no plano SaaS!`);
    // Clear form
    setNewShop({
      name: '',
      ownerName: '',
      email: '',
      location: '',
      plan: 'Premium',
      status: 'Active',
      mrr: '249.00'
    });
  };

  const handleDeleteShop = (id: string, name: string) => {
    setShops(shops.filter(s => s.id !== id));
    triggerToast(`Barbearia "${name}" foi removida do cadastro da plataforma.`);
  };

  const toggleShopStatus = (id: string, current: 'Active' | 'Pending' | 'Suspended') => {
    const nextStatusMap: Record<'Active' | 'Pending' | 'Suspended', 'Active' | 'Pending' | 'Suspended'> = {
      Active: 'Suspended',
      Suspended: 'Active',
      Pending: 'Active'
    };
    const nextStatus = nextStatusMap[current];
    setShops(shops.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    triggerToast(`Status da conveniada ajustado para: ${nextStatus}`);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    setCoupons([...coupons, {
      code: newCoupon.code.toUpperCase(),
      discount: newCoupon.discount,
      used: 0,
      total: newCoupon.total,
      expiry: newCoupon.expiry
    }]);
    setIsNewCouponOpen(false);
    triggerToast(`Cupom promocional ${newCoupon.code.toUpperCase()} criado!`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    // Append reply
    const updatedTickets = tickets.map(t => {
      if (t.id === activeTicketId) {
        return {
          ...t,
          lastMessage: replyMessage,
          messages: [
            ...t.messages,
            { sender: 'admin' as const, text: replyMessage, time: 'Agora' }
          ]
        };
      }
      return t;
    });
    setTickets(updatedTickets);
    setReplyMessage('');
    triggerToast('Mensagem de suporte enviada à barbearia conveniada.');
  };

  const handleSaveConfig = () => {
    triggerToast('Configuração global da plataforma BarberPro salva com sucesso na nuvem!');
  };

  const handleCopyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      triggerToast('Link do convite copiado para a área de transferência!');
    } catch {
      triggerToast('Não foi possível copiar o link automaticamente.');
    }
  };

  const handleCreateInvite = () => {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://barberpro-pi-pearl.vercel.app';
    const randomCode = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.floor(100000 + Math.random() * 900000).toString(16);
    const newId = `inv-${randomCode}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const newInvite = {
      id: newId,
      link: `${baseOrigin}/onboard/${newId}`,
      status: 'Active' as const,
      expires: expiresAt.toLocaleDateString('pt-BR'),
      limit: 1,
      used: 0,
    };

    setInvites((previousInvites) => [newInvite, ...previousInvites]);
    setIsInviteModalOpen(false);
    triggerToast('Novo convite de onboarding gerado com sucesso!');
  };

  return (
    <div className="flex bg-[#131313] text-[#e5e2e1] h-screen select-none font-sans overflow-hidden">
      {/* Sidebar Shell */}
      <aside className="fixed h-full left-0 w-[260px] border-r border-[#4d4635]/30 bg-[#1c1b1b]/50 backdrop-blur-xl z-50 flex flex-col py-6">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center">
            <Scissors className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-amber-500 uppercase tracking-widest font-sans">
              BarberPro
            </span>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest -mt-1">
              Super Admin SaaS
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'dashboard'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('shops')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'shops'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>Barbearias</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'subscriptions'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Subscrições</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'invites'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>Convites</span>
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'revenue'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Financeiro</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'support'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <Headphones className="w-4 h-4 shrink-0" />
            <span>Suporte</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'logs'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'users'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Utilizadores</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'settings'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configurações</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px] ${
              activeTab === 'monitor'
                ? 'text-amber-500 border-l-4 border-amber-500 bg-amber-500/10'
                : 'text-stone-400 hover:text-amber-500 hover:bg-neutral-950/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Monitorização</span>
          </button>
        </nav>

        {/* Support Operator Profile & Return to Main Context Toggle */}
        <div className="px-4 mt-auto space-y-3">
          <button
            onClick={() => {
              onBackToMain();
              triggerToast('Retornando ao Painel Comercial da Barbearia.');
            }}
            className="w-full bg-[#181817] border border-white/5 hover:border-amber-500/30 text-stone-200 hover:text-amber-500 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Painel Barbearia</span>
          </button>

          <div className="p-4 bg-[#111110] border border-white/5 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/20 relative overflow-hidden shrink-0">
              <Image
                className="object-cover"
                alt="Super Admin Master Controller avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-bkV9firaDNbZpCU2D4qTr2QPQ4uDAhrIbk_s-qB5MgbYIaP8jM9pLVh_d3i4z25cvtPkqjy-hB7pxNe714fvovXay0ZtqvKEWNnRwvEEaLbKJINtO9uaB6tX2WlaW1XFz_O6WiEn5GSEmDobeiwYqD0qzgu_c2r212J2CICINqTDV3aUP-unAVnkwwhHTHWGOWndjHj49iwR2AvsbSrzKTec3jHxhAXAotKoCvkfkETpS8m7rzERt9D0ZzyM62b-Kfd5hOwT76c"
                fill
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-bold text-stone-100 truncate">Alex Sterling</span>
              <span className="text-[9px] uppercase font-bold text-amber-500/70 tracking-wider">Diretor de Operações</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="ml-[260px] flex-1 flex flex-col overflow-hidden bg-[#0d0d0c]">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-40 bg-[#0d0d0c]/90 backdrop-blur-md border-b border-white/5 px-8 h-18 flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="font-serif text-xl font-medium text-stone-100">
              {activeTab === 'dashboard' && 'Dashboard SaaS'}
              {activeTab === 'shops' && 'Gestão de Barbearias'}
              {activeTab === 'subscriptions' && 'Gerenciamento de Planos'}
              {activeTab === 'invites' && 'Gestão de Convites'}
              {activeTab === 'revenue' && 'Lançamentos Financeiros'}
              {activeTab === 'support' && 'Central de Atendimento'}
              {activeTab === 'logs' && 'Logs e Auditoria'}
              {activeTab === 'users' && 'Utilizadores Globais'}
              {activeTab === 'settings' && 'Ajustes da Plataforma'}
              {activeTab === 'monitor' && 'Monitorização de Sistema'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-[#181817] hover:bg-neutral-800 rounded-xl relative transition-transform active:scale-95 text-stone-400">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <button className="p-2.5 bg-[#181817] hover:bg-neutral-800 rounded-xl transition-transform active:scale-95 text-stone-400">
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="h-8 w-[1px] bg-white/5 mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">Alex Vanes</span>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-[#0d0d0c] font-black text-xs flex items-center justify-center">
                M
              </div>
            </div>
          </div>
        </header>

        {/* Content View Routing */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* TAB 1: SHOPS DIRECTORY */}
          {activeTab === 'shops' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              {/* Stats & Title Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-medium text-[#e5e2e1]">Barbearias Registradas</h1>
                  <p className="text-stone-400 text-xs mt-1">Monitore, pause ou controle o acesso das conveniadas associadas ao SaaS.</p>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-[#111110] border border-white/5 px-6 py-3.5 rounded-2xl border-l-[3px] border-amber-500">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Total de Lojas SaaS</span>
                    <span className="text-xl font-bold font-mono text-stone-100">{stats.totalShops}</span>
                  </div>
                  <div className="bg-[#111110] border border-white/5 px-6 py-3.5 rounded-2xl border-l-[3px] border-amber-500">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Faturamento MRR</span>
                    <span className="text-xl font-bold font-mono text-amber-500">€ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Filters Toolbox Row */}
              <div className="bg-[#111110] border border-white/5 p-5 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Buscar por barbearia ou ID..."
                      value={searchShop}
                      onChange={(e) => setSearchShop(e.target.value)}
                      className="w-full bg-[#181817] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                    />
                  </div>

                  {/* Plan Filter */}
                  <div className="flex flex-col shrink-0">
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value as any)}
                      className="bg-[#181817] border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-stone-200 cursor-pointer"
                    >
                      <option value="All">Todos os Planos</option>
                      <option value="Basic">Plano Basic</option>
                      <option value="Professional">Plano Professional</option>
                      <option value="Premium">Plano Premium</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col shrink-0">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-[#181817] border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-stone-200 cursor-pointer"
                    >
                      <option value="All">Qualquer Status</option>
                      <option value="Active">Apenas Ativas</option>
                      <option value="Pending">Contas Pendentes</option>
                      <option value="Suspended">Apenas Suspensas</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Barbearia
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-[#111110] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-900/55 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Barbearia / ID</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Proprietário</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Localização</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Plano SaaS</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider text-right">Faturamento</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredShops.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-stone-500 text-xs">
                            Nenhuma barbearia cadastrada corresponde aos filtros de consulta.
                          </td>
                        </tr>
                      ) : (
                        filteredShops.map((shop) => (
                          <tr key={shop.id} className="hover:bg-neutral-900/35 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 animate-slide-up">
                                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-amber-500 overflow-hidden relative">
                                  <Scissors className="w-4 h-4 text-amber-500" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-stone-100">{shop.name}</div>
                                  <div className="text-[10px] font-mono text-stone-500">ID: {shop.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-stone-200">{shop.ownerName}</div>
                              <div className="text-[10px] text-stone-500">{shop.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-stone-400">
                                <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
                                <span className="text-xs">{shop.location}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                shop.plan === 'Premium' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                shop.plan === 'Professional' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                                'bg-stone-500/15 text-stone-400'
                              }`}>
                                {shop.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleShopStatus(shop.id, shop.status)}
                                className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
                                title="Clique para alternar status"
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  shop.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                  shop.status === 'Pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                  'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                }`} />
                                <span className="text-xs text-stone-300 group-hover:text-amber-500 transition-colors">
                                  {shop.status === 'Active' ? 'Ativo' : shop.status === 'Pending' ? 'Pendente' : 'Suspenso'}
                                </span>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-bold font-mono text-stone-100">€ {shop.mrr.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    triggerToast(`Sucesso! Efetuando login temporário como ${shop.ownerName} na barbearia ${shop.name}...`);
                                    setTimeout(() => onBackToMain(), 1500); // Simulate login redirect
                                  }}
                                  className="text-stone-400 hover:text-amber-500 p-1.5 bg-neutral-900 border border-white/5 rounded transition-all"
                                  title="Impersonate (Entrar na Conta)"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleShopStatus(shop.id, shop.status)}
                                  className="text-stone-400 hover:text-amber-500 p-1.5 bg-neutral-900 border border-white/5 rounded transition-all"
                                  title={shop.status === 'Suspended' ? 'Reativar Conveniada' : 'Suspender/Bloquear Conveniada'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteShop(shop.id, shop.name)}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 bg-neutral-900 border border-white/5 rounded transition-all"
                                  title="Remover Conveniada"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer page descriptor */}
                <div className="p-6 bg-neutral-900/25 border-t border-white/5 flex items-center justify-between text-xs text-stone-400">
                  <span>Exibindo {filteredShops.length} de {stats.totalShops} barbearias na rede SaaS</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 bg-[#181817] rounded border border-white/5 text-stone-400 hover:text-stone-200">
                      Anterior
                    </button>
                    <button className="px-3.5 py-1.5 bg-amber-500 text-[#0d0d0c] font-black rounded">
                      1
                    </button>
                    <button className="px-3 py-1.5 bg-[#1c1b1b] rounded border border-white/5 text-stone-500">
                      Próximo
                    </button>
                  </div>
                </div>
              </div>

              {/* REGISTER MODAL */}
              {isRegisterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0d0c]/85 backdrop-blur-sm">
                  <div className="bg-[#111110] border border-amber-500/20 rounded-2xl p-8 max-w-md w-full space-y-6 relative animate-slide-up">
                    <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase text-amber-500 font-bold tracking-widest block">SAAS INTEGRATION</span>
                        <h3 className="text-lg font-serif text-stone-100">Registrar Conveniada</h3>
                      </div>
                      <button
                        onClick={() => setIsRegisterModalOpen(false)}
                        className="p-1 px-2.5 bg-neutral-900 rounded font-mono text-stone-400 hover:text-white"
                      >
                        X
                      </button>
                    </div>

                    <form onSubmit={handleRegisterShop} className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Nome Comercial</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: BarberShop Elegance"
                          value={newShop.name}
                          onChange={(e) => setNewShop((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Owner */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Nome do Sócio/Gestor</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Lucas Mendes"
                          value={newShop.ownerName}
                          onChange={(e) => setNewShop((prev) => ({ ...prev, ownerName: e.target.value }))}
                          className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Email */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">E-mail Comercial</label>
                          <input
                            type="email"
                            required
                            placeholder="gestao@barber.com"
                            value={newShop.email}
                            onChange={(e) => setNewShop((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Cidade / País</label>
                          <input
                            type="text"
                            placeholder="Rio de Janeiro, BR"
                            value={newShop.location}
                            onChange={(e) => setNewShop((prev) => ({ ...prev, location: e.target.value }))}
                            className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Plan selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Plano Associado</label>
                          <select
                            value={newShop.plan}
                            onChange={(e) => {
                              const p = e.target.value as any;
                              const price = p === 'Premium' ? '249.00' : p === 'Professional' ? '149.00' : '49.00';
                              setNewShop((prev) => ({ ...prev, plan: p, mrr: price }));
                            }}
                            className="w-full bg-[#1c1b1b] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-stone-100"
                          >
                            <option value="Basic">Basic</option>
                            <option value="Professional">Professional</option>
                            <option value="Premium">Premium</option>
                          </select>
                        </div>
                        {/* Status */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Status Prévio</label>
                          <select
                            value={newShop.status}
                            onChange={(e) => setNewShop((prev) => ({ ...prev, status: e.target.value as any }))}
                            className="w-full bg-[#1c1b1b] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-stone-100"
                          >
                            <option value="Active">Ativo</option>
                            <option value="Pending">Pendente</option>
                            <option value="Suspended">Suspenso</option>
                          </select>
                        </div>
                      </div>

                      {/* Estimated Billing */}
                      <div className="pt-2">
                        <div className="bg-[#181817] px-4 py-3 rounded-xl border border-white/5 flex justify-between items-center">
                          <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Valor Cobrado (Mensual)</span>
                          <span className="text-sm font-extrabold text-amber-500 font-mono">
                            € {parseFloat(newShop.mrr).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRegisterModalOpen(false)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-stone-300 py-3 rounded-xl text-xs uppercase font-bold text-center transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Concluir Registro
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-medium text-[#e5e2e1]">Dashboard Geral</h1>
                  <p className="text-stone-400 text-xs mt-1">Acompanhamento do Crescimento Financeiro e do MRR acumulativo da plataforma SaaS.</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerToast('Relatório geral de finanças exportado em formato CSV/PDF!')}
                    className="px-5 py-2.5 bg-[#181817] border border-white/5 text-stone-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Relatório
                  </button>
                </div>
              </div>

              {/* Bento Stats Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* MRR Card */}
                <div className="bg-[#111110] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-12 h-12 text-amber-500" />
                  </div>
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-2">Total MRR Atual</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black font-mono text-white">€ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <span className="text-green-400 font-bold text-xs flex items-center mb-1 font-mono">
                      +12.5% vs ano ant.
                    </span>
                  </div>
                  <div className="mt-4 h-1 w-full bg-[#181817] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[78%] rounded-full"></div>
                  </div>
                </div>

                {/* Trials Card */}
                <div className="bg-[#111110] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-2">Trials Ativos</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black font-mono text-white">0</h3>
                    <span className="text-stone-500 font-bold text-xs flex items-center mb-1 font-mono">
                      Em conversão
                    </span>
                  </div>
                  <div className="mt-4 flex gap-1">
                    <div className="h-1.5 flex-1 bg-neutral-900 rounded"></div>
                    <div className="h-1.5 flex-1 bg-neutral-900 rounded"></div>
                  </div>
                </div>

                {/* Total Barbearias */}
                <div className="bg-[#111110] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-2">Total de Barbearias / Ativas</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black font-mono text-white">{stats.totalShops}</h3>
                    <span className="text-green-400 text-xs font-bold mb-1 font-mono">/ {stats.totalShops}</span>
                  </div>
                  {/* Avatars */}
                  <div className="mt-4 flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border-2 border-[#111110] flex items-center justify-center text-[10px] font-bold text-stone-400">GB</div>
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border-2 border-[#111110] flex items-center justify-center text-[10px] font-bold text-stone-400">PC</div>
                  </div>
                </div>

                {/* avg revenue per unit */}
                <div className="bg-[#111110] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-2">Tíquete Médio (ARPU)</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black font-mono text-white">€ {(stats.totalShops > 0 ? stats.mrr / stats.totalShops : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <span className="text-stone-500 text-xs mb-1">Taxa Estável</span>
                  </div>
                  <div className="mt-4 flex justify-between text-[9px] font-bold uppercase text-stone-500 tracking-wider">
                    <span>LTV Médio: € 0</span>
                    <span>Custo CAC: € 0</span>
                  </div>
                </div>

              </div>

              {/* TRAJECTORY GRAPHS MODULE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Chart SVG Canvas */}
                <div className="lg:col-span-8 bg-[#111110] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-stone-100">Trajetória do MRR Acumulado</h3>
                    <p className="text-stone-400 text-xs mt-1">Desenvolvimento nos últimos 12 meses na plataforma.</p>
                  </div>

                  <div className="h-64 w-full relative pt-6">
                    {/* SVG Curve */}
                    <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#f2ca50" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="50" x2="1000" y2="50" stroke="#1c1b1b" strokeWidth="1" />
                      <line x1="0" y1="150" x2="1000" y2="150" stroke="#1c1b1b" strokeWidth="1" />
                      <line x1="0" y1="250" x2="1000" y2="250" stroke="#1c1b1b" strokeWidth="1" />
                      
                      {/* Area Mask */}
                      <path d="M0,280 Q 200,260 400,180 T 800,90 T 1000,30 L 1000,300 L 0,300 Z" fill="url(#areaGrad)" />
                      
                      {/* Line Curve */}
                      <path d="M0,280 Q 200,260 400,180 T 800,90 T 1000,30" fill="none" stroke="#f2ca50" strokeWidth="3" />
                      
                      {/* Active points */}
                      <circle cx="1000" cy="30" r="5" fill="#f2ca50" className="animate-pulse" />
                      <circle cx="800" cy="90" r="4" fill="#f2ca50" />
                      <circle cx="400" cy="180" r="4" fill="#f2ca50" />
                    </svg>

                    <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase tracking-wider pt-2">
                      <span>Jun 25</span>
                      <span>Ago 25</span>
                      <span>Out 25</span>
                      <span>Dez 25</span>
                      <span>Fev 26</span>
                      <span>Abr 26</span>
                      <span>Mai 26</span>
                    </div>
                  </div>
                </div>

                {/* DISTRIBUTION SEGMENTS */}
                <div className="lg:col-span-4 bg-[#111110] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-stone-100">Divisão de Faturamento por Plano</h3>
                    <p className="text-stone-400 text-xs mt-1">Monitore quais planos trazem mais retorno.</p>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold font-mono">
                        <span className="text-stone-300">Plano Premium</span>
                        <span className="text-amber-500">0%</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[0%] rounded-full"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold font-mono">
                        <span className="text-stone-300">Plano Professional</span>
                        <span className="text-indigo-400">0%</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[0%] rounded-full"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold font-mono">
                        <span className="text-stone-300">Plano Basic</span>
                        <span className="text-stone-500">0%</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-500 w-[0%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Insights block */}
                  <div className="mt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <p className="text-[10px] text-stone-300 leading-relaxed">
                      <span className="text-amber-500 font-bold block mb-0.5">INSIGHT DE ANÁLISE:</span>
                      A conversão para o <span className="text-amber-500 font-bold">Plano Premium</span> subiu 8.4% de forma imediata após o lançamento dos novos relatórios de comissão automatizados nas barbearias.
                    </p>
                  </div>
                </div>

              </div>

              {/* RECENT INVOICES MATRIX */}
              <div className="bg-[#111110] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/30">
                  <h3 className="font-serif text-lg font-medium text-stone-100">Faturas e Invoices de Recibo Coletados</h3>
                  <button
                    onClick={() => triggerToast('Carregando arquivo acumulado das faturas SaaS do último ciclo...')}
                    className="text-xs font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400"
                  >
                    Ver Tudo
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-neutral-900/10 text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                        <th className="px-6 py-4">ID da Fatura</th>
                        <th className="px-6 py-4">Barbearia / Conveniada</th>
                        <th className="px-6 py-4">Status de Liquidação</th>
                        <th className="px-6 py-4">Data do Ciclo</th>
                        <th className="px-6 py-4 text-right">Valor Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-stone-300">
                      <tr className="hover:bg-neutral-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-amber-500">#INV-9821</td>
                        <td className="px-6 py-4">The Golden Blade (ID: BP-7822)</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/10">Pago</span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 font-mono">12 Mai, 2026</td>
                        <td className="px-6 py-4 text-right font-bold text-stone-100 font-mono">€ 249,00</td>
                      </tr>
                      <tr className="hover:bg-neutral-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-amber-500">#INV-9820</td>
                        <td className="px-6 py-4">Precision Cuts (ID: BP-4412)</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/15">Pendente</span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 font-mono">11 Mai, 2026</td>
                        <td className="px-6 py-4 text-right font-bold text-stone-100 font-mono">€ 149,00</td>
                      </tr>
                      <tr className="hover:bg-neutral-900/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-amber-500">#INV-9818</td>
                        <td className="px-6 py-4">Heritage Grooming (ID: BP-3321)</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/10">Pago</span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 font-mono">10 Mai, 2026</td>
                        <td className="px-6 py-4 text-right font-bold text-stone-100 font-mono">€ 249,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PLANS & COUPONS MANAGEMENT */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-medium text-[#e5e2e1]">Planos de Assinatura & Cupons</h1>
                  <p className="text-stone-400 text-xs mt-1">Configure o preço, capacidade máxima de cadeiras e acessos de cada plano SaaS do ecossistema.</p>
                </div>
                
                <button
                  onClick={() => triggerToast('Opção de criar novo plano de assinatura em escala aberta!')}
                  className="bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Plano
                </button>
              </div>

              {/* STATS STRIP ROW */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111110] p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Clientes Ativos</span>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono">0</span>
                    <span className="text-stone-500 text-xs font-bold"></span>
                  </div>
                </div>
                <div className="bg-[#111110] p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Faturamento Planos</span>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono">€ 0</span>
                    <span className="text-stone-500 text-xs font-bold"></span>
                  </div>
                </div>
                <div className="bg-[#111110] p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Taxa Churn</span>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono">0%</span>
                    <span className="text-stone-500 text-xs font-bold"></span>
                  </div>
                </div>
                <div className="bg-[#111110] p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Conversão de Cupons</span>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono">0%</span>
                    <span className="text-stone-500 text-xs font-bold"></span>
                  </div>
                </div>
              </div>

              {/* MANAGEMENT SECTIONS CONTAINER GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* PLAN LIMITS CONFIGURATOR (Left Column 8 col) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2 text-stone-100">
                    <Settings className="w-5 h-5 text-amber-500" />
                    <h3 className="font-serif text-lg font-medium">Controles de Capacidade das Barbearias</h3>
                  </div>

                  {/* Plan 1 card */}
                  <div className="bg-[#111110] p-6 rounded-2xl border border-white/5 border-l-4 border-amber-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-serif text-stone-100 font-bold">Plano Artisan Solo</h4>
                        <p className="text-stone-400 text-xs mt-1">Concedido para barbeiros independentes ou autônomos.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-amber-500">€ {plans.artisanSolo.price}</span>
                        <span className="text-stone-500 text-[10px] uppercase block tracking-wider font-bold">por mês</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-5 border-y border-white/5 my-4">
                      {/* Limits input */}
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider select-none block">LIMITES OPERACIONAIS</span>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-300">Cadeiras de Barbeiro</span>
                            <input
                              type="number"
                              value={plans.artisanSolo.barberSeats}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, barberSeats: parseInt(e.target.value) || 0 }
                              })}
                              className="w-16 bg-[#181817] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-amber-500 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-300">Agendamentos / Mês</span>
                            <input
                              type="text"
                              value={plans.artisanSolo.appointments}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, appointments: e.target.value }
                              })}
                              className="w-16 bg-[#181817] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-amber-500 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider select-none block">RECURSOS DO PLANO</span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-[#e5e2e1]">
                            <input
                              type="checkbox"
                              checked={plans.artisanSolo.analytics}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, analytics: e.target.checked }
                              })}
                              className="form-checkbox text-amber-500 bg-[#181817] border border-white/10 rounded"
                            />
                            <span>Módulo de Relatórios</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-[#e5e2e1]">
                            <input
                              type="checkbox"
                              checked={plans.artisanSolo.sms}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, sms: e.target.checked }
                              })}
                              className="form-checkbox text-amber-500 bg-[#181817] border border-white/10 rounded"
                            />
                            <span>Disparo de lembretes SMS</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-500 hover:text-[#e5e2e1] opacity-60">
                            <input
                              type="checkbox"
                              checked={plans.artisanSolo.multiLocation}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, multiLocation: e.target.checked }
                              })}
                              className="form-checkbox text-amber-500 bg-[#181817] border border-white/10 rounded"
                            />
                            <span>Dashboards Multilojas</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-stone-500">
                      <span>Plano ativo em <span className="font-bold text-stone-300">1.240 barbearias</span></span>
                      <button
                        onClick={() => triggerToast('Parâmetros de limites de Artisan Solo reconfigurados!')}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl font-bold uppercase tracking-wider text-[10px]"
                      >
                        Salvar Configurações
                      </button>
                    </div>
                  </div>

                  {/* Plan 2 Card */}
                  <div className="bg-[#111110] p-6 rounded-2xl border border-white/5 border-l-4 border-stone-500 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-serif text-stone-100 font-bold">Plano Studio Master</h4>
                        <p className="text-stone-400 text-xs mt-1">Desenvolvido para barbearias tradicionais com equipe consolidada.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-amber-500">€ {plans.studioMaster.price}</span>
                        <span className="text-stone-500 text-[10px] uppercase block tracking-wider font-bold">por mês</span>
                      </div>
                    </div>

                    <div className="text-center py-4 bg-[#1c1b1b] border border-white/5 rounded-xl italic text-xs text-stone-500">
                      Configurações avançadas de equipe sênior, controle de pagamentos integrados e faturamento multissalas...
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => triggerToast('Abertura de formulário estendido do Plano Studio Master.')}
                        className="px-4 py-2 text-stone-300 bg-neutral-900 border border-white/5 duration-200 hover:text-white rounded-xl font-bold uppercase tracking-wider text-[10px]"
                      >
                        Editar Parâmetros Estendidos
                      </button>
                    </div>
                  </div>

                </div>

                {/* COUPONS & PROMOTIONS PANEL (Right Columns) */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-serif text-lg font-medium text-stone-100">Cupons de Campanha</h3>
                      <button
                        onClick={() => setIsNewCouponOpen(true)}
                        className="text-amber-500 hover:text-amber-400 font-bold text-[10px] uppercase tracking-widest"
                      >
                        + Criar Cupom
                      </button>
                    </div>

                    <div className="space-y-4">
                      {coupons.map((coupon, i) => (
                        <div key={i} className="bg-[#111110] p-4.5 rounded-2xl border border-white/5 hover:border-amber-500/25 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-sm font-black text-amber-500 tracking-widest">{coupon.code}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10 text-[9px] font-black uppercase font-mono">{coupon.discount}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span>Uso: {coupon.used}/{coupon.total} faturados</span>
                            <span>Validade: {coupon.expiry}</span>
                          </div>
                          <div className="mt-3.5 h-1 w-full bg-neutral-900 rounded-full">
                            <div className="h-full bg-amber-500 rounded" style={{ width: `${(coupon.used / coupon.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Coupon Modal */}
                  {isNewCouponOpen && (
                    <div className="p-5 bg-[#111110] border border-amber-500/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs font-serif font-black text-white">Novo Cupom SaaS</span>
                        <button onClick={() => setIsNewCouponOpen(false)} className="text-stone-500">X</button>
                      </div>

                      <form onSubmit={handleCreateCoupon} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Código</label>
                          <input
                            type="text"
                            placeholder="SAAS30"
                            required
                            value={newCoupon.code}
                            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                            className="w-full bg-[#181817] border border-white/10 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Desconto</label>
                          <select
                            value={newCoupon.discount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                            className="w-full bg-[#1c1b1b] border border-white/10 rounded px-2 py-1.5 text-xs text-stone-200"
                          >
                            <option value="20% OFF">20% de Desconto</option>
                            <option value="30% OFF">30% de Desconto</option>
                            <option value="€50 FLAT">Desconto fixo de €50</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black uppercase py-2 text-[10px] rounded tracking-widest duration-150-all"
                        >
                          Salvar Cupom Promocional
                        </button>
                      </form>
                    </div>
                  )}

                  {/* PLATFORM MEMBER GROWTH */}
                  <div className="bg-[#111110] border border-white/5 p-5 rounded-2xl">
                    <h3 className="font-serif text-sm font-medium text-stone-100 mb-4">Quota Total de Escala</h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Espaço de Armazenamento Central</span>
                        <span className="text-amber-500 font-bold">42.8 GB / 100 GB</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-900 rounded-full">
                        <div className="h-full bg-amber-500 rounded" style={{ width: '42.8%' }} />
                      </div>

                      <div className="flex justify-between pt-2">
                        <span className="text-stone-400">Disparos de Mensagens (SMS/Email)</span>
                        <span className="text-amber-500 font-bold">85% Alocado</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-900 rounded-full">
                        <div className="h-full bg-indigo-500 rounded" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT DESK WORKSPACE */}
          {activeTab === 'support' && (
            <div className="flex flex-col lg:flex-row h-[78vh] -m-8 border-t border-white/5">
              
              {/* TICKETS DIRECTORY NAVIGATION (Left Pane) */}
              <section className="w-full lg:w-1/3 border-r border-white/5 bg-[#111110] flex flex-col h-full overflow-y-auto">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/10">
                  <h3 className="font-serif text-lg font-medium text-stone-100">Chamados de Ajuda</h3>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/15 text-[9px] font-black rounded uppercase tracking-widest">Ativos</span>
                </div>

                <div className="flex-1 divide-y divide-white/5">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicketId(t.id)}
                      className={`p-6 cursor-pointer transition-all border-l-4 ${
                        activeTicketId === t.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-transparent hover:bg-neutral-900/35'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          t.priority === 'High' ? 'bg-rose-500/20 text-rose-400' :
                          t.priority === 'Normal' ? 'bg-amber-500/20 text-stone-300' :
                          'bg-neutral-800 text-stone-400'
                        }`}>
                          {t.priority === 'High' ? 'Prioridade Alta' : 'Normal'}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">{t.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-100 mb-1">{t.title}</h4>
                      <p className="text-[11px] text-stone-400 line-clamp-1">{t.lastMessage}</p>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center font-bold text-[9px] font-mono">
                            {t.shopShort}
                          </div>
                          <span className="text-[10px] text-stone-400">{t.shopName}</span>
                        </div>
                        <span className={`text-[9px] font-bold ${
                          t.status === 'In Progress' ? 'text-amber-500' :
                          t.status === 'Open' ? 'text-indigo-400' :
                          'text-stone-500 line-through'
                        }`}>
                          {t.status === 'In Progress' ? 'Em Atendimento' : t.status === 'Open' ? 'Aberto' : 'Resolvido'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CHAT PLATFORM INTERACTION (Middle Pane 2/3) */}
              <section className="flex-1 bg-[#131313] flex flex-col h-full overflow-hidden">
                
                {/* Chat header info */}
                <div className="bg-[#111110]/95 p-6 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-neutral-900 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-100">{currentActiveTicket.shopName}</h3>
                      <p className="text-[10px] text-stone-400">
                        Chamado <span className="text-amber-500 font-bold uppercase tracking-wider font-mono">{currentActiveTicket.id}</span> • Aberto por Administrador Comercial • {currentActiveTicket.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const updated = tickets.map(t => t.id === activeTicketId ? { ...t, status: 'Resolved' as const } : t);
                        setTickets(updated);
                        triggerToast('Chamado marcado como "Resolvido"!');
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Resolver Chamado
                    </button>
                  </div>
                </div>

                {/* Conversation Scroller (Scroll body) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {currentActiveTicket.messages.map((m, idx) => {
                    const isAdminMsg = m.sender === 'admin';
                    return (
                      <div key={idx} className={`flex gap-3 max-w-xl ${isAdminMsg ? 'ml-auto flex-row-reverse text-right' : 'text-left'}`}>
                        {isAdminMsg ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-[#0d0d0c] font-black text-xs flex items-center justify-center shrink-0">
                            SA
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/10 font-bold text-[10px] flex items-center justify-center text-amber-500 font-mono shrink-0">
                            {currentActiveTicket.shopShort}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                            isAdminMsg
                              ? 'bg-amber-500/10 text-stone-200 border border-amber-500/15 rounded-tr-none'
                              : 'bg-[#181817] text-stone-300 border border-white/5 rounded-tl-none'
                          }`}>
                            {m.text}
                          </div>
                          <span className="text-[9px] font-mono text-stone-500 select-none block">
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Message Input */}
                <div className="p-6 bg-[#111110] border-t border-white/5">
                  <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                      type="text"
                      placeholder={`Escreva uma mensagem resposta para ${currentActiveTicket.shopName}...`}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="flex-1 bg-[#181817] border border-white/10 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-5 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <Send className="w-4 h-4" />
                      Responder
                    </button>
                  </form>
                </div>

              </section>

              {/* INSPECTOR PANEL DETAIL (Right Sidebar) */}
              <aside className="hidden xl:block w-72 bg-[#1c1b1b] border-l border-white/5 p-6 space-y-8 overflow-y-auto">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-4">Informação Cadastral</h4>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-stone-500" />
                      <div>
                        <p className="font-bold text-stone-200">Soho, Londres</p>
                        <p className="text-[10px] text-stone-500">Unidade Matriz</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <div>
                        <p className="font-bold text-stone-200">Plano Premium Elite</p>
                        <p className="text-[10px] text-stone-500">Membro desde Nov 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-stone-500" />
                      <div>
                        <p className="font-bold text-stone-200">12 Profissionais Ativos</p>
                        <p className="text-[10px] text-stone-500">8 logados no caixa hoje</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Controles de Alerta</h4>
                  <button
                    onClick={() => triggerToast('Equipe comercial orientada para revisão cadastral desta franquia.')}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-stone-300 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Auditar Logs Financeiros
                  </button>
                  <button
                    onClick={() => triggerToast('Notificação estrita enviada ao e-mail de gerência!')}
                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-400 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Notificar Alerta Estrito
                  </button>
                </div>
              </aside>

            </div>
          )}

          {/* TAB 5: PLATFORM CONFIG/SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              <header className="border-b border-white/5 pb-4">
                <h1 className="font-serif text-3xl font-medium text-[#e5e2e1]">Configuração Global Plataforma</h1>
                <p className="text-stone-400 text-xs mt-1">Gerencie a identidade corporativa, níveis de segurança restritos, integrações de pagamento e alertas.</p>
              </header>

              {/* Settings navigation bar inside content */}
              <div className="flex gap-6 border-b border-white/5 mb-8 overflow-x-auto">
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'general' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Identidade SaaS
                </button>
                <button
                  onClick={() => setSettingsTab('security')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'security' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Segurança MFA
                </button>
                <button
                  onClick={() => setSettingsTab('billing')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'billing' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Gateway Financeiro
                </button>
                <button
                  onClick={() => setSettingsTab('notifications')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'notifications' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Alertas de Instabilidade
                </button>
              </div>

              {/* Sub tab Content router */}
              {settingsTab === 'general' && (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-7 bg-[#111110] border border-white/5 p-8 rounded-2xl space-y-6">
                    <h3 className="font-serif text-lg font-medium text-stone-100 mb-2">Informações de Branding</h3>
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Nome do Produto Principal</label>
                          <input
                            type="text"
                            value={platformConfig.name}
                            onChange={(e) => setPlatformConfig({ ...platformConfig, name: e.target.value })}
                            className="w-full bg-[#181817] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500 text-stone-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">E-mail Operacional Central</label>
                          <input
                            type="text"
                            value={platformConfig.email}
                            onChange={(e) => setPlatformConfig({ ...platformConfig, email: e.target.value })}
                            className="w-full bg-[#181817] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500 text-stone-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Descrição do Produto (SEO Meta)</label>
                        <textarea
                          rows={3}
                          value={platformConfig.description}
                          onChange={(e) => setPlatformConfig({ ...platformConfig, description: e.target.value })}
                          className="w-full bg-[#181817] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500 text-stone-200 resize-none leading-relaxed"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Logo assets update mockup */}
                  <div className="col-span-12 lg:col-span-5 bg-[#111110] border-2 border-dashed border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 animate-float">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-serif font-black text-stone-100">Logotipo Institucional</h4>
                    <p className="text-[11px] text-stone-400 mt-1 mb-5 max-w-xs">
                      Faça o upload de logotipo SVG ou PNG em alta fidelidade com canal de transparência preservado (mín. 512x512px).
                    </p>
                    <button
                      type="button"
                      onClick={() => triggerToast('Upload de imagem desabilitado temporariamente no ambiente de sandboxed.')}
                      className="bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-stone-200 px-6 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer"
                    >
                      Carregar Arquivo SVG
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'security' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#111110] border border-white/5 p-8 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-serif text-stone-100 font-bold">Autenticação de Dois Fatores (MFA)</h4>
                        <p className="text-xs text-stone-400 mt-1">Exija passkeys corporativas, tokens ou MFA para acesso de operadores de barbearia.</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setPlatformConfig({ ...platformConfig, mfaEnabled: !platformConfig.mfaEnabled });
                          triggerToast(`Configuração de segurança MFA: ${!platformConfig.mfaEnabled ? 'Ativada' : 'Desativada'}`);
                        }}
                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          platformConfig.mfaEnabled ? 'bg-amber-500' : 'bg-neutral-800'
                        }`}
                      >
                        <div className={`w-5.5 h-5.5 bg-[#0d0d0c] rounded-full transition-transform ${
                          platformConfig.mfaEnabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="mt-4 p-4.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
                      <p className="text-[11px] text-stone-300">
                        Nível de Compliance atual: <span className="text-amber-500 font-bold font-mono">92%</span> de todas as barbearias integradas ativaram MFA nos canais administrativos.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#111110] border border-white/5 p-8 rounded-2xl space-y-4">
                    <h4 className="text-base font-serif text-stone-100 font-bold">Tempo Limite de Sessão Admin</h4>
                    <p className="text-xs text-stone-400">Tempo de inatividade de segurança prévio para desconexão forçada.</p>
                    
                    <select
                      value={platformConfig.sessionTimeout}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, sessionTimeout: e.target.value })}
                      className="w-full bg-[#181817] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-200 cursor-pointer"
                    >
                      <option value="15 Minutes">15 minutos</option>
                      <option value="30 Minutes">30 minutos</option>
                      <option value="60 Minutes">1 hora</option>
                      <option value="Never (Not Recommended)">Nunca redefinir (Inseguro)</option>
                    </select>
                  </div>
                </div>
              )}

              {settingsTab === 'billing' && (
                <div className="bg-[#111110] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 bg-amber-500/5">
                    <h4 className="text-base font-serif text-[#e5e2e1] font-bold">Conexões de Gateway SaaS</h4>
                    <p className="text-xs text-stone-400 mt-1">Configure as credenciais e conexões centrais de distribuição do ecossistema comercial.</p>
                  </div>

                  <div className="divide-y divide-white/5">
                    <div className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-stone-900 border border-white/5 flex items-center justify-center shrink-0">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-100">Strip Premium Checkout & Connect</h4>
                          <p className="text-[10px] text-stone-400">Status de integração: <span className="text-green-400 font-bold font-mono">Conectado e Ativo</span></p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerToast('Painel de Configurações avançadas do Stripe Connect inicializado.')}
                        className="px-4 py-2 border border-white/10 hover:border-amber-500/30 text-stone-300 hover:text-amber-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Reconfigurar
                      </button>
                    </div>

                    <div className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-4 opacity-50">
                        <div className="w-12 h-12 rounded-xl bg-neutral-900 text-stone-500 border border-white/5 flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-100">PayPal Express Braintree Checkout</h4>
                          <p className="text-[10px] text-stone-500">Status de integração: <span className="text-stone-500 font-bold">Não Configurado</span></p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerToast('Inicializando chaves de autenticação do PayPal Braintree...')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Definir Conexão
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'notifications' && (
                <div className="bg-[#111110] border border-white/5 p-8 rounded-2xl space-y-6">
                  <h4 className="text-base font-serif text-stone-100 font-bold">Relatório de Eventos Críticos</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-neutral-900/30 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                        <div>
                          <p className="text-xs font-bold text-stone-100">Queda de Sistema / Outages</p>
                          <p className="text-[10px] text-stone-500">Notificar gerência de suporte de forma imediata por SMS.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-bold text-[9px] uppercase tracking-wider">Alta Prioridade</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-900/30 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-xs font-bold text-stone-101">Relatório de Upgrade de Barbearia</p>
                          <p className="text-[10px] text-stone-500">Resumo acumulado diário das novas assinaturas.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-neutral-800 text-stone-400 rounded font-bold text-[9px] uppercase tracking-wider">Notificação Média</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE ACTION FLOATING BAR */}
              <div className="flex justify-end gap-3 pt-6 border-t border-white/5 select-none">
                <button
                  type="button"
                  onClick={() => triggerToast('Ajustes descartados ao estado inicial.')}
                  className="px-6 py-3 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-bold uppercase tracking-wider duration-150-all"
                >
                  Descartar Alterações
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 duration-150-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>

            </div>
          )}

          {/* TAB 6: INVITES */}
          {activeTab === 'invites' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-medium text-[#e5e2e1]">Convites (Onboarding)</h1>
                  <p className="text-stone-400 text-xs mt-1">Gerencie os links de convite para novas barbearias entrarem na plataforma.</p>
                </div>
                
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Gerar Convite
                </button>
              </div>

              <div className="bg-[#111110] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-900/55 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Código / Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Link de Acesso</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider text-center">Usos</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Expiração</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invites.map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-900/35 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-stone-100 font-mono">{inv.id}</div>
                            <div className="text-[10px] uppercase font-bold mt-1">
                              <span className={inv.status === 'Active' ? 'text-green-500' : 'text-rose-500'}>{inv.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-neutral-900 px-2 py-1 rounded text-stone-300 font-mono select-all">
                              {inv.link}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-stone-100">{inv.used}</span>
                            <span className="text-stone-500 text-xs"> / {inv.limit}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-stone-400 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              {inv.expires}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                               onClick={() => handleCopyInviteLink(inv.link)}
                               className="text-stone-400 hover:text-amber-500 p-1.5 bg-neutral-900 border border-white/5 rounded"
                               title="Copiar Link"
                             >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

               {/* INVITE MODAL */}
              {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0d0c]/85 backdrop-blur-sm">
                  <div className="bg-[#111110] border border-amber-500/20 rounded-2xl p-8 max-w-sm w-full space-y-6 animate-slide-up relative">
                    <div className="border-b border-white/5 pb-4">
                        <span className="text-[10px] uppercase text-amber-500 font-bold tracking-widest block">SAAS CONTROL</span>
                        <h3 className="text-lg font-serif text-stone-100">Gerar Novo Convite</h3>
                    </div>
                    <div>
                        <p className="text-xs text-stone-400 mb-2">Este processo gerencia a criação de um link seguro de cadastro (onboarding) para uma nova barbearia parceira na plataforma BarberPro.</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80">Regras do convite:</p>
                        <ul className="text-xs text-stone-400 list-disc list-inside mt-1 ml-1 space-y-1">
                            <li>Expira em 31/12/2026.</li>
                            <li>Válido para 1 loja.</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(false)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-stone-300 py-3 rounded-xl text-xs uppercase font-bold text-center transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateInvite}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Confirmar
                        </button>
                    </div>
                  </div>
               </div>
              )}
            </div>
          )}

          {/* TAB 7: REVENUE (PHASE 3) */}
          {activeTab === 'revenue' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <DollarSign className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Gestão Financeira (Brevemente)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Painel financeiro multiloja com caixa isolado e automações inteligentes (Fase 3).</p>
            </div>
          )}

          {/* TAB 8: LOGS (PHASE 2) */}
          {activeTab === 'logs' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Auditoria & Logs (Fase 2)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Histórico global de alterações em planos, criação de lojas e eventos de sistema.</p>
            </div>
          )}

          {/* TAB 9: USERS (GLOBAL) */}
          {activeTab === 'users' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Equipa Global (Em Desenvolvimento)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Controlo de perfis administrativos de suporte e gestão da plataforma (Owner, Support, Billing).</p>
            </div>
          )}

          {/* TAB 10: MONITOR (TECHNICAL) */}
          {activeTab === 'monitor' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Infraestrutura SaaS (Em breve)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Status de APIs, conectividade com Stripe, WhatsApp e monitorização da base de dados Supabase.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
