'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  AgendaView,
  AgendamentosView,
  ClientesView,
  BarbeirosView,
  ServicosView,
  CaixaView,
  ControleView,
  EstoqueView,
  FidelizacaoView
} from '../components/dashboard-views';
import { SuperAdminView } from '../components/super-admin-views';
import { AuthOverlay, AccessDeniedView } from '../components/auth-views';
import { supabase } from '../lib/supabase';
import {
  loadTableData,
  saveRow,
  deleteRow,
  getSyncStatus,
  SUPABASE_SETUP_SQL
} from '../lib/supabase-service';
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  UserCheck,
  Sparkles,
  DollarSign,
  Wallet,
  Package,
  Award,
  TrendingUp,
  Settings,
  Bell,
  Search,
  Check,
  Smile,
  Clipboard,
  Palette,
  Heart,
  ArrowRight,
  MoreVertical,
  Star,
  ChevronRight,
  AlertTriangle,
  Plus,
  Home,
  User,
  Menu,
  CheckSquare,
  Coffee,
  CheckCircle2,
  Trash2,
  RefreshCw,
  LogOut,
  Sliders,
  Store
} from 'lucide-react';

// Define core interfaces
interface Appointment {
  id: string;
  time: string;
  clientName: string;
  serviceName: string;
  price: number;
  status: 'Confirmado' | 'Em andamento' | 'Concluído' | 'Cancelado';
  avatarUrl: string;
  barberId?: string;
}

interface Barber {
  id: string;
  name: string;
  specialty: string;
  room: string;
  status: 'Atendendo' | 'Ausente' | 'Livre';
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
}

interface StockItem {
  id: string;
  name: string;
  status: 'Estoque baixo' | 'Estoque crítico' | 'Estoque normal';
  quantity: number;
  category: 'inventory' | 'soap' | 'warning';
}

  // Array of services dynamically populated from Supabase
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  scissors: Scissors,
  smile: Smile,
  sparkles: Sparkles,
  clipboard: Clipboard,
  palette: Palette,
  heart: Heart,
  award: Award,
  star: Star,
  coffee: Coffee,
  package: Package,
};

// Super admin check: email must match NEXT_PUBLIC_SUPER_ADMIN_EMAIL env var,
// or fall back to the hardcoded demo super admin email.
const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ||
  'superadmin@barberpro.com';

function isSuperAdmin(user: any): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  return email === SUPER_ADMIN_EMAIL;
}

export default function HomeView() {
  // Navigation State
  const [view, setView] = useState<'landing' | 'dashboard' | 'superadmin'>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'agenda' | 'agendamentos' | 'clientes' | 'barbeiros' | 'servicos' | 'caixa' | 'controle' | 'estoque' | 'fidelizacao'>('dashboard');

  // Supabase Sync Indicator States
  const [supabaseSync, setSupabaseSync] = useState<{ connected: boolean; message: string; source: 'supabase' | 'local' }>({
    connected: false,
    message: 'Aguardando nuvem...',
    source: 'local'
  });
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    // 1. Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // 2. Subscribe to auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Dynamic services state (to make catalogs interactive)
  const [services, setServices] = useState<any[]>([]);

  // Clients database state for CRM Integration
  const [clients, setClients] = useState<any[]>([]);

  // Operational cash register state
  const [cashRegisterStatus, setCashRegisterStatus] = useState<'aberto' | 'fechado'>('aberto');
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);

  // Modals status for CRM and Settings
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '' });

  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [barberForm, setBarberForm] = useState({ name: '', specialty: '', room: 'Sala 05', status: 'Livre' as const, rating: 5.0 });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', duration: '30 min', price: '', description: '', iconKey: 'scissors' });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', quantity: '', category: 'inventory' as const });

  const [isQuickCashOpen, setIsQuickCashOpen] = useState(false);
  const [quickCashForm, setQuickCashForm] = useState({ type: 'faturamento', amount: '', description: '', category: 'Venda Geral' });

  const [selectedLoyaltyClient, setSelectedLoyaltyClient] = useState<string | null>(null);

  // Notifications State for micro-interactions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // State core representing scheduling system database (Hydrates from standard state)
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [finances, setFinances] = useState({
    faturamento: 0,
    despesas: 0,
  });

  // Daily Metrics calculates dynamically
  const [dailyTarget, setDailyTarget] = useState(5000);
  
  const averageTicket = useMemo(() => {
    const fms = cashTransactions.filter((t: any) => t.type === 'faturamento');
    if (fms.length === 0) return 0;
    const total = fms.reduce((sum, t: any) => sum + Number(t.amount || 0), 0);
    return total / fms.length;
  }, [cashTransactions]);

  // Active state counters
  const [activeClientsCount, setActiveClientsCount] = useState(0);

  // Dynamic metrics of simulation & states for additional menu panels
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>('2026-05-28');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('Todos');
  const [clientSearchFilter, setClientSearchFilter] = useState('');
  const [clientFormState, setClientFormState] = useState({ name: '', email: '', phone: '' });
  const [isClientFormExpanded, setIsClientFormExpanded] = useState(false);
  const [barberCommission, setBarberCommission] = useState<number>(50);
  const [newBarberForm, setNewBarberForm] = useState({ name: '', specialty: '', room: 'Sala 05' });
  const [isBarberFormExpanded, setIsBarberFormExpanded] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({ name: '', price: '', duration: '30 min', description: '' });
  const [isServiceFormExpanded, setIsServiceFormExpanded] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'Todos' | 'faturamento' | 'despesas'>('Todos');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [newProductForm, setNewProductForm] = useState({ name: '', quantity: 10 });
  const [isProductFormExpanded, setIsProductFormExpanded] = useState(false);
  const [loyaltyRewardSelection, setLoyaltyRewardSelection] = useState<string>('corte-gratis');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  // Load data from Supabase only after an authenticated session exists.
  useEffect(() => {
    if (!supabase || !currentUser) {
      return;
    }

    let isMounted = true;

    async function loadAllSupabaseData() {
      try {
        const syncStatus = await getSyncStatus();

        if (!isMounted) return;

        // 1. Services table - seed with real standard production services
        const resServices = await loadTableData<any>('services', []);
        setServices(resServices.data);

        // 2. Clients table - starts completely empty/production ready
        const resClients = await loadTableData<any>('clients', []);
        setClients(resClients.data);
        setActiveClientsCount(resClients.data.length);

        // 3. Transactions table - starts completely empty
        const resTransactions = await loadTableData<any>('transactions', []);
        setCashTransactions(resTransactions.data);

        // Calculate finances values on-the-fly through actual database table sums
        const totFat = resTransactions.data.filter((t: any) => t.type === 'faturamento').reduce((sum: number, t: any) => sum + t.amount, 0);
        const totDes = resTransactions.data.filter((t: any) => t.type === 'despesas').reduce((sum: number, t: any) => sum + t.amount, 0);
        setFinances({
          faturamento: totFat,
          despesas: totDes
        });

        // 4. Barbers table - starts empty (the user can create their custom team)
        const resBarbers = await loadTableData<Barber>('barbers', []);
        setBarbers(resBarbers.data);

        // 5. Stock items table - starts empty
        const resStock = await loadTableData<StockItem>('stock_items', []);
        setStockItems(resStock.data);

        // 6. Appointments table - starts empty
        const resAppointments = await loadTableData<Appointment>('appointments', []);
        setAppointments(resAppointments.data);

        setSupabaseSync({
          connected: syncStatus.connected,
          message: syncStatus.message,
          source: resServices.source
        });
      } catch (err) {
        console.error('Falha de inicialização ao conectar com Supabase:', err);
      }
    }

    loadAllSupabaseData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Active filters and query for appointments search on dashboard
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');

  // Schedulings input Modal state
  const [isSchedulingsOpen, setIsSchedulingsOpen] = useState(false);
  const [selectedPredefinedService, setSelectedPredefinedService] = useState<string>('');
  const [bookingFormData, setBookingFormData] = useState({
    name: '',
    serviceId: '',
    barberId: '',
    date: '2026-05-28',
    time: '14:30',
  });

  // Financial Increment modal
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    type: 'faturamento' as 'faturamento' | 'despesas',
    amount: '',
    description: '',
  });

  // Restock action State helper
  const [selectedRestockItem, setSelectedRestockItem] = useState<StockItem | null>(null);

  // Revenue active chart node index tooltip hover tracker
  const [activeChartNode, setActiveChartNode] = useState<number | null>(null);

  const handleOpenBooking = (serviceId?: string) => {
    setBookingFormData((prev) => ({
      ...prev,
      serviceId: serviceId || services[0].id,
      barberId: barbers[0].id,
    }));
    setIsSchedulingsOpen(true);
  };

  const handleUpdateAppointmentStatus = (apptId: string, newStatus: 'Confirmado' | 'Em andamento' | 'Concluído' | 'Cancelado') => {
    setAppointments((prev) => {
      const updated = prev.map((appt) => appt.id === apptId ? { ...appt, status: newStatus } : appt);
      const target = updated.find((appt) => appt.id === apptId);
      if (target) {
        saveRow('appointments', target);
      }
      return updated;
    });
    triggerToast(`Status do agendamento atualizado para "${newStatus}"!`);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFormData.name.trim()) {
      triggerToast('Por favor, informe seu nome!');
      return;
    }

    const selectedService = services.find((s) => s.id === bookingFormData.serviceId) || services[0];
    const selectedBarber = barbers.find((b) => b.id === bookingFormData.barberId) || barbers[0];

    // Build the new appointment item
    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      time: bookingFormData.time,
      clientName: bookingFormData.name,
      serviceName: selectedService.name,
      price: selectedService.price,
      status: 'Confirmado',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmIz94TADtLTH8nW_WmrsbHOQYrFKDh7ia8EU1ADPl_muO6mGkC8H5xW3Tizc3RrsUbHqNQ7nJcKBgb9YvTFlneGOIo8xdFM_ZxlqmnHQeNj-myQTm6wbz7hchIIabdPH4GWUoVZ-4pE5r_CQ6_owPo-b29N4TFAL-D92oVfNUeT_40_C2ERFZWjcAQqZ2defAYdGA1GubLhtANblIuct2h4uZNOmiiV91blPoBJjLXYA6OzLVRruhvJ3ZqKhffCiAFq3bzJbqQxI',
      barberId: bookingFormData.barberId || barbers[0].id,
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    saveRow('appointments', newAppointment);

    // Update dynamic statistics: increment monthly billing automatically
    setFinances((prev) => ({
      ...prev,
      faturamento: prev.faturamento + selectedService.price,
    }));

    // Post to Cash register transaction list dynamically
    const newTrans = {
      id: `t-${Date.now()}`,
      type: 'faturamento' as const,
      amount: selectedService.price,
      description: `Agendamento: ${selectedService.name} - ${bookingFormData.name}`,
      date: bookingFormData.date,
      category: 'Serviço',
    };
    setCashTransactions((prev) => [newTrans, ...prev]);
    saveRow('transactions', newTrans);

    // Upsert client inside CRM list
    setClients((prev) => {
      const match = prev.find((c) => c.name.toLowerCase() === bookingFormData.name.toLowerCase());
      if (match) {
        const ucl = {
          ...match,
          sales: match.sales + 1,
          spent: match.spent + selectedService.price,
          loyaltyPoints: match.loyaltyPoints + selectedService.price,
          lastVisit: bookingFormData.date,
        };
        saveRow('clients', ucl);
        return prev.map((c) => c.id === match.id ? ucl : c);
      } else {
        const ncl = {
          id: `cli-${Date.now()}`,
          name: bookingFormData.name,
          email: `${bookingFormData.name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
          phone: '(11) 99999-8888',
          sales: 1,
          spent: selectedService.price,
          loyaltyPoints: selectedService.price,
          lastVisit: bookingFormData.date,
        };
        saveRow('clients', ncl);
        return [...prev, ncl];
      }
    });

    triggerToast(`Olá ${bookingFormData.name}, seu agendamento de ${selectedService.name} com ${selectedBarber.name} às ${bookingFormData.time} foi CONFIRMADO!`);
    setIsSchedulingsOpen(false);
    setBookingFormData({
      name: '',
      serviceId: '',
      barberId: '',
      date: '2026-05-28',
      time: '14:30',
    });
  };

  // Restock execution action
  const handleRestock = (item: StockItem) => {
    setStockItems((prev) => {
      const updated = prev.map((s) => (s.id === item.id ? { ...s, status: 'Estoque normal' as const, quantity: s.quantity + 10 } : s));
      const target = updated.find(s => s.id === item.id);
      if (target) {
        saveRow('stock_items', target);
      }
      return updated;
    });
    triggerToast(`${item.name} reabastecido! (+10 unidades adicionadas)`);
    setSelectedRestockItem(null);
  };

  // Toggle barber presence status directly
  const handleToggleBarber = (barberId: string) => {
    setBarbers((prev) => {
      const updated = prev.map((b) => {
        if (b.id === barberId) {
          const statusCycle: Barber['status'][] = ['Livre', 'Atendendo', 'Ausente'];
          const currentIdx = statusCycle.indexOf(b.status);
          const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
          return { ...b, status: nextStatus };
        }
        return b;
      });
      const target = updated.find(b => b.id === barberId);
      if (target) {
        saveRow('barbers', target);
      }
      return updated;
    });
    triggerToast('Disponibilidade do barbeiro atualizada!');
  };

  // Complete appointment manually from dashboard list or remove it
  const handleCompleteAppt = (id: string) => {
    setAppointments((prev) => {
      let updatedAppt: any = null;
      const nextAppts = prev.map((a) => {
        if (a.id === id) {
          if (a.status !== 'Concluído') {
            const newT = {
              id: `t-comp-${Date.now()}`,
              type: 'faturamento' as const,
              amount: a.price,
              description: `Atendimento Concluído: ${a.serviceName} - ${a.clientName}`,
              date: '2026-05-28',
              category: 'Serviço',
            };
            setCashTransactions((t) => [newT, ...t]);
            saveRow('transactions', newT);

            setClients((cl) =>
              cl.map((c) => {
                if (c.name.toLowerCase() === a.clientName.toLowerCase()) {
                  const ucl = { ...c, loyaltyPoints: c.loyaltyPoints + a.price, spent: c.spent + a.price, sales: c.sales + 1 };
                  saveRow('clients', ucl);
                  return ucl;
                }
                return c;
              })
            );
          }
          updatedAppt = { ...a, status: 'Concluído' as const };
          saveRow('appointments', updatedAppt);
          return updatedAppt;
        }
        return a;
      });
      return nextAppts;
    });
    triggerToast('Atendimento marcado como concluído e pontos creditados!');
  };

  const handleRemoveAppt = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    deleteRow('appointments', id);
    triggerToast('Agendamento removido.');
  };

  // Financial manual updater
  const handleFinancialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(financialForm.amount);
    if (isNaN(val) || val <= 0) {
      triggerToast('Por favor, informe uma quantia válida!');
      return;
    }

    if (financialForm.type === 'faturamento') {
      setFinances((prev) => ({ ...prev, faturamento: prev.faturamento + val }));
      triggerToast(`Faturamento incrementado em € ${val.toFixed(2)}`);
    } else {
      setFinances((prev) => ({ ...prev, despesas: prev.despesas + val }));
      triggerToast(`Despesas incrementadas em € ${val.toFixed(2)}`);
    }

    setIsFinancialModalOpen(false);
    setFinancialForm({ type: 'faturamento', amount: '', description: '' });
  };

  // Scroll animations observer attachment for landing view elements
  useEffect(() => {
    const reveals = document.querySelectorAll('.scroll-reveal');
    const handleScroll = () => {
      reveals.forEach((r) => {
        const windowHeight = window.innerHeight;
        const revealTop = r.getBoundingClientRect().top;
        const revealPoint = 130;

        if (revealTop < windowHeight - revealPoint) {
          r.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // initial trigger

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute stats on-the-fly
  const totalAgendamentosHoje = useMemo(() => {
    return appointments.filter((a: any) => a.status !== 'Concluído').length;
  }, [appointments]);

  const totalReceitaDia = useMemo(() => {
    return appointments
      .filter((a: any) => a.status === 'Concluído')
      .reduce((sum, item) => sum + item.price, 0);
  }, [appointments]);

  const lucroLiquido = useMemo(() => {
    return finances.faturamento - finances.despesas;
  }, [finances]);

  const pendingStockAlertsCount = useMemo(() => {
    return stockItems.filter((s) => s.status !== 'Estoque normal').length;
  }, [stockItems]);

  // Daily Chart coordinates (Mock path, but dynamic data structure for revenue)
  const weeklyData = [
    { day: 'Seg', isCompleted: false, revenue: 0, coordinates: { cx: 40, cy: 155 } },
    { day: 'Ter', isCompleted: true, revenue: 0, coordinates: { cx: 150, cy: 130 } },
    { day: 'Qua', isCompleted: false, revenue: 0, coordinates: { cx: 250, cy: 145 } },
    { day: 'Qui', isCompleted: true, revenue: 0, coordinates: { cx: 360, cy: 110 } },
    { day: 'Sex', isCompleted: false, revenue: 0, coordinates: { cx: 470, cy: 140 } },
    { day: 'Sáb', isCompleted: true, revenue: 0, coordinates: { cx: 580, cy: 80 } },
    { day: 'Dom', isCompleted: false, revenue: 0, coordinates: { cx: 680, cy: 50 } },
  ];

  return (
    <div className="relative min-h-screen custom-scrollbar selection:bg-primary/30">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
          >
            <div className="bg-surface-container-high border border-primary/40 backdrop-blur-xl px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <div className="p-1.5 bg-primary/20 rounded-lg text-primary shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold tracking-wide text-on-surface line-clamp-2">
                {toastMessage}
              </p>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-auto text-on-surface-variant hover:text-on-surface p-1 rounded-md"
              >
                <span className="text-xs font-bold font-mono">X</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW DE LANDING PAGE */}
      {view === 'landing' && (
        <div className="flex flex-col w-full h-full bg-[#0d0d0c] text-stone-100 overflow-x-hidden select-none">
          {/* Top Navbar */}
          <nav className="sticky top-0 z-50 bg-[#0d0d0c]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            <div className="flex justify-between items-center w-full px-6 md:px-12 py-4 max-w-7xl mx-auto">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-lg font-extrabold text-stone-100 tracking-wider">
                    BARBERPRO
                  </span>
                  <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest -mt-1">
                    Barbearia & Club
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:flex gap-8 items-center">
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-amber-500 border-b border-amber-500 pb-1" href="#inicio">Início</a>
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-all" href="#espaco">O Espaço</a>
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-all" href="#services">Serviços</a>
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-all" href="#barbers">Barbeiros</a>
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-all" href="#clube">Membro Club</a>
                <a className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-all" href="#localizacao">Contato</a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Discreet Super Admin Login Key */}
                <button
                  onClick={() => {
                    setView('superadmin');
                    triggerToast('Painel de controle Super Admin SaaS carregado com sucesso!');
                  }}
                  className="p-2.5 bg-neutral-900 border border-amber-500/10 hover:border-amber-500/30 rounded-lg text-amber-500 hover:text-amber-400 transition-all text-xs flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider"
                  title="Acesso Plataforma SaaS"
                >
                  <Store className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Portal SaaS</span>
                </button>

                {/* Discreet Admin Login Key */}
                <button
                  onClick={() => {
                    setView('dashboard');
                    triggerToast('Painel administrativo administrativo carregado com sucesso!');
                  }}
                  className="p-2.5 bg-neutral-900 border border-white/5 rounded-lg text-stone-400 hover:text-amber-500 hover:border-amber-500/30 transition-all text-xs flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider"
                  title="Acesso Administrativo"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>

                <button
                  onClick={() => handleOpenBooking()}
                  className="bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 active:scale-95 duration-150 cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar Horário
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section id="inicio" className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden py-16">
            <div className="absolute inset-0 z-0">
              <Image
                className="w-full h-full object-cover hero-mask opacity-30 transition-transform duration-700 ease-out scale-105"
                alt="Modern premium barbershop background studio"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfTngPOZnP-VdARgyUk_7DwjuAlrLTW3NBTW2scRK7yAbNPKIjJJ612OznInmLS5ET-dx-pkmHeHYwTgL3M7DMoSXx5_5Dn1RjnOd2gJAVigsCjRkuVPFwo7c-rktGZ2jDjL4b84H9FGkRngp9Wa7tiWX8bdNeqifxzewSCI4mXdI_PhFgI5Vn7eZ-OIDQP1UPbTiRoORu-N7HMVFr8l2nlTOeO5f-2gHZeRfr-b9frU7MCfkIUu9OCa3AqWsoX6nrQwU0YgNmqYY"
                fill
                priority
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0c] via-[#0d0d0c]/80 to-[#0d0d0c]/30"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c] via-transparent to-[#0d0d0c]/60"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-12 items-center">
              {/* Bold Title and Story */}
              <div className="lg:col-span-7 space-y-6 animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-[1px] bg-amber-500"></span>
                  <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase block">
                    Corte e Cuidado Exclusivos Desde 2018
                  </span>
                </div>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-white">
                  O encontro da <span className="text-amber-500 font-normal italic">tradição</span> com o seu melhor estilo.
                </h1>
                <p className="font-sans text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Muito mais do que estética, proporcionamos uma verdadeira imersão clássica de bem-estar. Relaxe em nossas poltronas retrô de couro, saboreie um chopp IPA artesanal gelado cortesia e desfrute do profissionalismo de barbeiros especializados no melhor que há em visagismo e navalha quente.
                </p>
                
                {/* Visual badges of premium feel */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 max-w-lg">
                  <div>
                    <p className="text-amber-500 text-xl font-bold font-mono">1.200+</p>
                    <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Cavalheiros Satisfeitos</p>
                  </div>
                  <div>
                    <p className="text-amber-500 text-xl font-bold font-mono">100%</p>
                    <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Chopp Artesanal Livre</p>
                  </div>
                  <div>
                    <p className="text-amber-500 text-xl font-bold font-mono">4.9/5</p>
                    <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Avaliações Google</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="#services"
                    className="border border-amber-500/40 hover:bg-amber-500/10 hover:border-amber-500 text-amber-500 font-bold px-6 py-3.5 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    Ver Menu de Serviços
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* INTEGRATED DIRECT BOOKING WIDGET (Replaces old SaaS Card) */}
              <div className="lg:col-span-15 w-full max-w-md mx-auto relative group">
                <div className="absolute -inset-1 bg-amber-500/10 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[#111110] border border-amber-500/15 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <span className="text-[10px] uppercase text-amber-500 font-bold tracking-widest block mb-1">RESERVA EXPRESS</span>
                    <h3 className="text-lg font-serif text-white">Garanta seu Horário</h3>
                    <p className="text-xs text-stone-400">Escolha o serviço e barbeiro de preferência</p>
                  </div>

                  <form onSubmit={handleConfirmBooking} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome"
                        value={bookingFormData.name}
                        onChange={(e) => setBookingFormData((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Service */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Serviço Pretendido</label>
                      <select
                        value={bookingFormData.serviceId || (services[0]?.id || '')}
                        onChange={(e) => setBookingFormData((p) => ({ ...p, serviceId: e.target.value }))}
                        className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 focus:border-amber-500 cursor-pointer focus:outline-none"
                      >
                        <option value="" disabled className="text-stone-500 bg-[#111110]">Selecione um Serviço...</option>
                        {services.map((srv) => (
                          <option key={srv.id} value={srv.id} className="bg-[#111110] text-[#e5e2e1]">
                            {srv.name} (€ {srv.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Barber */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Barbeiro de Escolha</label>
                      <select
                        value={bookingFormData.barberId || (barbers[0]?.id || '')}
                        onChange={(e) => setBookingFormData((p) => ({ ...p, barberId: e.target.value }))}
                        className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 focus:border-amber-500 cursor-pointer focus:outline-none"
                      >
                        <option value="" disabled className="text-stone-500 bg-[#111110]">Selecione um Profissional...</option>
                        {barbers.map((b) => (
                          <option key={b.id} value={b.id} className="bg-[#111110] text-[#e5e2e1]">
                            {b.name} ({b.specialty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Data</label>
                        <input
                          type="date"
                          required
                          value={bookingFormData.date}
                          onChange={(e) => setBookingFormData((p) => ({ ...p, date: e.target.value }))}
                          className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Previsão Hora</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 14:30"
                          value={bookingFormData.time}
                          onChange={(e) => setBookingFormData((p) => ({ ...p, time: e.target.value }))}
                          className="w-full bg-[#181817] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Estimated Pricing in Card */}
                    <div className="pt-2">
                      <div className="bg-[#181817] px-4 py-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Valor do Serviço</span>
                        <span className="text-base font-extrabold text-amber-500 font-mono">
                          € {(services.find((s) => s.id === (bookingFormData.serviceId || services[0]?.id))?.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/15 duration-150 transition-all text-xs tracking-wider uppercase cursor-pointer"
                    >
                      Confirmar Reserva Agora
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* O ESPAÇO & EXPERIÊNCIA SECTION */}
          <section id="espaco" className="py-24 max-w-7xl mx-auto px-6 md:px-12 border-t border-white/5 scroll-reveal">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase">Muito mais que estética</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">O Ritual de Cuidados Próprio do Homem Premium</h2>
              <div className="w-12 h-[2px] bg-amber-500 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Highlight 1 */}
              <div className="p-8 bg-[#111110] border border-white/5 rounded-2xl space-y-6 hover:border-amber-500/20 duration-300 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-serif text-white">Cerveja Especial & Drinks</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Você ganha de cortesia no check-in no bar interno do club uma dose de single malt whisky importado ou uma cerveja artesanal IPA trincando de gelada. Sente-se e descontraia na espera.
                  </p>
                </div>
                <div className="text-[10px] text-amber-500/70 font-bold tracking-widest uppercase">Cortesia do Don</div>
              </div>

              {/* Highlight 2 */}
              <div className="p-8 bg-[#111110] border border-white/5 rounded-2xl space-y-6 hover:border-amber-500/20 duration-300 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-serif text-white">Toalhas Quentes & Aromas</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Nossa barbaterapia tradicional inclui técnica clássica de toalhas quentes cozidas no vapor de eucalipto, massagem facial cicatrizante e espuma de colágeno aquecida para proteção da sua pele.
                  </p>
                </div>
                <div className="text-[10px] text-amber-500/70 font-bold tracking-widest uppercase">Relaxamento Focado</div>
              </div>

              {/* Highlight 2 */}
              <div className="p-8 bg-[#111110] border border-white/5 rounded-2xl space-y-6 hover:border-amber-500/20 duration-300 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-serif text-white">Visagismo Personalizado</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Nenhum corte é igual ao outro. Nossos barbeiros analisam o seu formato de rosto, alinhamento capilar e marcas de personalidade para desenhar a silhueta de barba e cabelo que mais lhe favorece.
                  </p>
                </div>
                <div className="text-[10px] text-amber-500/70 font-bold tracking-widest uppercase">Exclusividade Pura</div>
              </div>
            </div>
          </section>

          {/* SERVICES CATALOG SECTION (Styled physical chalkboard design menu) */}
          <section id="services" className="py-24 bg-[#111110] border-y border-white/5 scroll-reveal">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div className="space-y-3">
                  <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase">Menu de Escolhas</span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">Nossos Serviços Clássicos & Premium</h2>
                  <div className="w-12 h-[2px] bg-amber-500"></div>
                </div>
                <p className="text-stone-400 text-xs max-w-md leading-relaxed">
                  Trabalhamos exclusivamente com cosméticos importados, técnicas artesanais e instrumentos esterilizados de alto padrão para polir sua imagem.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, idx) => {
                  const IconComp = ICON_MAP[service.iconKey] || Scissors;
                  const isCombo = service.id === 'combo';
                  return (
                    <div
                      key={service.id}
                      className={`bg-[#0d0d0c] p-6 rounded-2xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between h-full border ${
                        isCombo ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-white/5'
                      } hover:border-amber-500/30`}
                    >
                      <div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-amber-500 transition-transform ${isCombo ? 'bg-amber-500 text-[#0d0d0c]' : 'bg-neutral-900'}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif text-lg font-medium mb-2 text-white flex items-center gap-2">
                          {service.name}
                          {isCombo && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[8px] rounded uppercase font-sans font-black tracking-widest">Recomendado</span>}
                        </h3>
                        <p className="text-stone-400 text-xs leading-relaxed mb-6">{service.description}</p>
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-neutral-900">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Duração: {service.duration}</p>
                          <p className="text-xl text-amber-500 font-black font-mono">€ {service.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleOpenBooking(service.id)}
                          className={`font-sans text-[10px] uppercase tracking-wider font-extrabold px-4 py-2.5 rounded transition-all cursor-pointer ${isCombo ? 'bg-amber-500 text-[#0d0d0c] hover:bg-amber-400 shadow-md shadow-amber-500/15' : 'bg-neutral-900 text-stone-300 hover:bg-neutral-800 hover:text-stone-100'}`}
                        >
                          Agendar Serviço
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* BARBERS TEAM SECTION */}
          <section id="barbers" className="py-24 scroll-reveal">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                <div className="space-y-3">
                  <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase">Especialistas</span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">Profissionais Responsáveis pelo seu Estilo</h2>
                  <div className="w-12 h-[2px] bg-amber-500"></div>
                </div>
                <button
                  onClick={() => handleOpenBooking()}
                  className="text-amber-500 flex items-center gap-2 font-bold hover:gap-4 transition-all uppercase tracking-widest text-xs"
                >
                  Agendar com Profissional <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="group relative overflow-hidden rounded-2xl bg-[#111110] border border-white/5 hover:border-amber-500/35 hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="w-full h-[340px] relative">
                      <Image
                        className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                        alt={barber.name}
                        src={barber.avatarUrl}
                        fill
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0d] via-[#0e0e0d]/50 to-transparent"></div>
                    </div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h4 className="font-serif text-lg font-medium text-white leading-tight">{barber.name}</h4>
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">{barber.specialty}</p>
                      
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-stone-300 font-bold text-xs">{barber.rating}</span>
                        <span className="text-stone-500 text-[10px] ml-1">({barber.reviewsCount} cortes)</span>
                      </div>

                      <button
                        onClick={() => {
                          setBookingFormData((prev) => ({ ...prev, barberId: barber.id }));
                          handleOpenBooking();
                        }}
                        className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-amber-500/10 cursor-pointer"
                      >
                        Agendar Horário Com Ele
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CLUB DE ASSINATURA MEMBERSHIP (Replaces Old SaaS Pricing table) */}
          <section id="clube" className="py-24 bg-[#111110] border-y border-white/5 text-center scroll-reveal">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="max-w-2xl mx-auto mb-16 space-y-3">
                <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase">Estilo sempre impecável</span>
                <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">Confraria BarberPro: Nossos Clubes Mensais</h2>
                <div className="w-12 h-[2px] bg-amber-500 mx-auto"></div>
                <p className="text-stone-400 text-xs max-w-lg mx-auto pt-2">
                  Faça parte do nosso seleto clube de assinantes e tenha acesso a cortes livres, tratamentos ilimitados e descontos em cervejas especiais no bar.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-stretch pt-4 text-left">
                {/* Plan 1 */}
                <div className="bg-[#0d0d0c] border border-white/5 p-8 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 duration-300 transition-all hover:shadow-xl relative">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-serif text-white">Confraria Gentleman</h4>
                      <p className="text-stone-400 text-xs">Ideal para o cuidado recorrente de cabelo.</p>
                    </div>
                    
                    <div className="bg-[#111110] p-4 rounded-xl border border-white/5">
                      <span className="text-3xl font-bold font-mono text-amber-500">€ 49</span>
                      <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">/ mês</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-stone-300 border-t border-neutral-900 pt-5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>2 Cortes de Cabelo por mês</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Lavagem e escovação sênior</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>2 Cervejas IPA ou cafezinho livre</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>10% Off em pomadas e ceras do estoque</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setView('dashboard');
                      triggerToast('Sua assinatura Gentleman está sendo ativada! Bem-vindo ao Club.');
                    }}
                    className="w-full mt-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-stone-200 hover:text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl border border-white/10 duration-150 cursor-pointer"
                  >
                    Adquirir Assinatura Club
                  </button>
                </div>

                {/* Plan 2 */}
                <div className="bg-[#0d0d0c] border border-amber-500/40 p-8 rounded-2xl flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/5 duration-300 transition-all relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-[#0d0d0c] text-[8px] font-black tracking-widest uppercase px-4 py-1 rounded-full">
                    O Mais Escolhido
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-serif text-white">Confraria Imperial Prestige</h4>
                      <p className="text-stone-400 text-xs">Alinhamento estético completo e recorrente.</p>
                    </div>
                    
                    <div className="bg-[#111110] p-4 rounded-xl border border-amber-500/20">
                      <span className="text-3xl font-bold font-mono text-amber-500">€ 99</span>
                      <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">/ mês</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-stone-300 border-t border-neutral-900 pt-5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-extrabold text-stone-100">Cortes de Cabelo Ilimitados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>2 Barbaterapias com toalhas quentes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Tratamento de vapor de ozônio capilar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Bebida (Chopp/Whisky) Livre em toda visita</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setView('dashboard');
                      triggerToast('Assinatura Imperial Prestige solicitada. Bem-vindo ao Club de Estilo.');
                    }}
                    className="w-full mt-8 py-3 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] font-black uppercase tracking-wider text-[10px] rounded-xl duration-150 cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    Fazer Parte do Club Premium
                  </button>
                </div>

                {/* Plan 3 */}
                <div className="bg-[#0d0d0c] border border-white/5 p-8 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 duration-300 transition-all hover:shadow-xl relative">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-serif text-white">Confraria Lord Royal VIP</h4>
                      <p className="text-stone-400 text-xs">O topo do cuidado estético privativo.</p>
                    </div>
                    
                    <div className="bg-[#111110] p-4 rounded-xl border border-white/5">
                      <span className="text-3xl font-bold font-mono text-amber-500">€ 199</span>
                      <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">/ mês</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-stone-300 border-t border-neutral-900 pt-5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-black text-stone-100">Cabelo & Barba Premium Ilimitados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Design de Sobrancelha em cada visita</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>1 Creme Hidratante de Barba para levar em casa</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Atendimento exclusivo em Sala VIP acústica</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setView('dashboard');
                      triggerToast('Acesso Lord Royal VIP em processamento. Sala Privativa reservada.');
                    }}
                    className="w-full mt-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-stone-200 hover:text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl border border-white/10 duration-150 cursor-pointer"
                  >
                    Adquirir Plano Real Lord
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* LOCALIZAÇÃO & HORÁRIO SECTION */}
          <section id="localizacao" className="py-24 scroll-reveal">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 text-left">
                <div className="space-y-3">
                  <span className="text-amber-500 font-sans text-xs font-extrabold tracking-widest uppercase">Tradição acessível</span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white font-medium">Onde Nos Encontrar & Contato</h2>
                  <div className="w-12 h-[2px] bg-amber-500"></div>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex gap-4 p-4 bg-[#111110] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-stone-500 font-bold tracking-wider">Endereço Clássico</p>
                      <p className="text-white text-sm font-serif mt-1">Av. da Liberdade 110, 1250-146 Lisboa, Portugal</p>
                      <p className="text-stone-400 text-xs mt-0.5">Próximo à Praça dos Restauradores (Com estacionamento no local)</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4 p-4 bg-[#111110] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Smile className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-stone-500 font-bold tracking-wider">Contato Direto</p>
                      <p className="text-white text-sm font-serif mt-1">+351 213 456 789 / geral@barberproclub.com</p>
                      <p className="text-stone-400 text-xs mt-0.5">Ligue ou envie uma mensagem caso necessite de horários especiais</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-4 p-4 bg-[#111110] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-stone-500 font-bold tracking-wider">Horários Oficiais de Atendimento</p>
                      <p className="text-white text-sm font-serif mt-1">Segunda a Sexta: 09:00h às 21:00h</p>
                      <p className="text-white text-sm font-serif mt-0.5">Sábado: 09:00h às 20:00h</p>
                      <p className="text-amber-500 text-xs mt-1 font-bold">Domingo: Reservado para folga e manutenção clássica do espaço</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Styled Interactive/Aesthetic Map Card */}
              <div className="p-4 bg-[#111110] border border-white/5 rounded-3xl relative h-[420px] overflow-hidden group">
                <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-all duration-700">
                  {/* Styled architectural map layout representation */}
                  <div className="w-full h-full bg-[#1c1c1a] relative flex items-center justify-center">
                    <div className="absolute w-[600px] h-2 bg-neutral-900 rotate-12"></div>
                    <div className="absolute w-[600px] h-3 bg-neutral-900 -rotate-45"></div>
                    <div className="absolute w-[600px] h-1.5 bg-neutral-900 rotate-90"></div>
                    <div className="absolute w-[200px] h-[200px] border-4 border-dashed border-amber-500/10 rounded-full animate-pulse"></div>
                    <div className="absolute p-4 px-6 bg-[#0d0d0c] border border-amber-500/40 rounded-xl flex flex-col items-center gap-1 z-10 shadow-3xl">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                      <span className="font-serif text-xs font-bold text-white tracking-widest mt-1">BARBERPRO CLUB</span>
                      <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Sua Localização de Elite</span>
                    </div>
                  </div>
                </div>
                {/* Visual guidelines */}
                <div className="absolute bottom-5 left-5 right-5 bg-[#0d0d0c]/90 border border-white/5 p-4 rounded-xl backdrop-blur flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-amber-500 font-bold uppercase block tracking-widest">ESTACIONAMENTO PRIVADO</span>
                    <span className="text-xs text-stone-300">Valet e cortesia para clientes em atendimento.</span>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    className="p-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-stone-200 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider duration-150 cursor-pointer"
                  >
                    Rotas GPS
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#0e0e0d] border-t border-white/5 py-12 px-8 mt-auto text-stone-400">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col items-center md:items-start gap-2">
                <span className="font-sans text-md text-white font-extrabold tracking-widest uppercase">
                  BARBERPRO CLUB
                </span>
                <p className="text-[10px] text-stone-500">
                  &copy; {new Date().getFullYear()} BarberPro Club • Tradição e Excelência Estética Masculina Sênior. Todos os direitos reservados.
                </p>
              </div>
              <div className="flex gap-8 text-[10px] uppercase font-black tracking-widest">
                <a className="text-stone-500 hover:text-amber-500 transition-colors" href="#inicio">Privacidade</a>
                <a className="text-stone-500 hover:text-amber-500 transition-colors" href="#services">Termos de Uso</a>
                <a className="text-stone-500 hover:text-amber-500 transition-colors" href="#localizacao">Trabalhe Conosco</a>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation for quick mobile shortcuts */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0c]/95 backdrop-blur-xl border-t border-white/5 rounded-t-xl shadow-2xl h-16 px-4 flex justify-around items-center">
            <button
              onClick={() => {
                document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center text-amber-500"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] uppercase font-black mt-0.5 tracking-wider">Início</span>
            </button>
            <button
              onClick={() => handleOpenBooking()}
              className="flex flex-col items-center justify-center text-stone-400 hover:text-amber-500"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] uppercase font-black mt-0.5 tracking-wider">Agendar</span>
            </button>
            <button
              onClick={() => {
                setView('dashboard');
                triggerToast('Carregando Painel Administrativo de Controle...');
              }}
              className="flex flex-col items-center justify-center text-stone-400 hover:text-amber-500"
            >
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[9px] uppercase font-black mt-0.5 tracking-wider">Meu Painel</span>
            </button>
          </nav>

          {/* Floating Action Button (FAB) (Only on larger layouts) */}
          <button
            onClick={() => handleOpenBooking()}
            className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-[#0d0d0c] rounded-full shadow-2xl items-center justify-center hover:scale-110 active:scale-95 transition-all group z-40 cursor-pointer animate-bounce"
          >
            <Plus className="w-8 h-8 font-black" />
            <span className="absolute right-full mr-4 bg-[#111110] border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all translate-x-4 group-hover:translate-x-0">
              Agendar Horário Online
            </span>
          </button>
        </div>
      )}

      {/* VIEW DE ACCONA / DASHBOARD ADMINISTRATIVO */}
      {view === 'dashboard' && (
        !currentUser ? (
          <AuthOverlay
            targetView="dashboard"
            onSuccess={(usr) => {
              setCurrentUser(usr);
              triggerToast('Painel administrativo administrativo carregado com sucesso!');
            }}
            onCancel={() => setView('landing')}
            triggerToast={triggerToast}
          />
        ) : (currentUser?.user_metadata?.role !== 'gerente' && currentUser?.user_metadata?.role !== 'barbeiro') ? (
          <AccessDeniedView
            requiredRoles={['gerente', 'barbeiro']}
            onBack={() => setView('landing')}
            triggerToast={triggerToast}
          />
        ) : (
          <div className="flex h-screen w-full bg-background overflow-hidden relative">
          
          {/* Sidebar */}
          <aside
            className={`hidden md:flex flex-col bg-surface-container-low border-r border-outline-variant/20 h-full overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out shrink-0 ${
              isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
            }`}
          >
            {/* Sidebar Brand header */}
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
              <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center shrink-0">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="overflow-hidden"
                >
                  <h1 className="font-display-lg text-headline-sm font-bold text-primary leading-none whitespace-nowrap">
                    BarberPro
                  </h1>
                  <p className="text-[10px] text-on-surface-variant uppercase font-medium tracking-widest mt-1 whitespace-nowrap">
                    Admin Panel
                  </p>
                </motion.div>
              )}
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 px-3 mt-6 space-y-1">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
                { icon: Calendar, label: 'Agenda', id: 'agenda' },
                { icon: FileText, label: 'Agendamentos', id: 'agendamentos' },
                { icon: Users, label: 'Clientes', id: 'clientes' },
                { icon: UserCheck, label: 'Barbeiros', id: 'barbeiros' },
                { icon: Sparkles, label: 'Serviços', id: 'servicos' },
              ].map((item, idx) => {
                const NavIcon = item.icon;
                const isActive = dashboardTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDashboardTab(item.id as any);
                      triggerToast(`Painel "${item.label}" carregado.`);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group overflow-hidden ${
                      isActive ? 'sidebar-item-active font-semibold' : 'text-on-surface-variant/80 hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    <NavIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                    {!isSidebarCollapsed && (
                      <span className="font-label-md text-sm truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}

              <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                {!isSidebarCollapsed ? 'Financeiro' : '---'}
              </div>

              {[
                { icon: DollarSign, label: 'Caixa', id: 'caixa' },
                { icon: Wallet, label: 'Controle', id: 'controle' },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isActive = dashboardTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDashboardTab(item.id as any);
                      triggerToast(`Ativando controle de Caixa/Financeiro para "${item.label}".`);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group overflow-hidden ${
                      isActive ? 'sidebar-item-active font-semibold' : 'text-on-surface-variant/80 hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                    {!isSidebarCollapsed && <span className="font-label-md text-sm">{item.label}</span>}
                  </button>
                );
              })}

              <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                {!isSidebarCollapsed ? 'Gestão' : '---'}
              </div>

              {[
                { icon: Package, label: 'Estoque', id: 'estoque' },
                { icon: Award, label: 'Fidelização', id: 'fidelizacao' },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isActive = dashboardTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDashboardTab(item.id as any);
                      triggerToast(`Acessando interface de gerenciamento para "${item.label}".`);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group overflow-hidden ${
                      isActive ? 'sidebar-item-active font-semibold' : 'text-on-surface-variant/80 hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                    {!isSidebarCollapsed && <span className="font-label-md text-sm">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar User info & trigger switch return to site */}
            <div className="p-4 mt-auto border-t border-outline-variant/10 space-y-3">
              <button
                onClick={() => {
                  setView('superadmin');
                  triggerToast('Carregando Portal Super Admin SaaS...');
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all font-semibold border border-amber-500/10 cursor-pointer"
              >
                <Store className="w-5 h-5 shrink-0 text-amber-500" />
                {!isSidebarCollapsed && <span className="font-label-md text-sm">Super Admin SaaS</span>}
              </button>

              <button
                onClick={() => {
                  setView('landing');
                  triggerToast('Retornando para a Landing Page principal.');
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-primary hover:bg-primary/10 transition-all font-semibold cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0 text-primary rotate-180" />
                {!isSidebarCollapsed && <span className="font-label-md text-sm">Voltar ao Site</span>}
              </button>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl overflow-hidden">
                <div className="w-10 h-10 rounded-full border border-primary/20 relative shrink-0">
                  <Image
                    className="object-cover"
                    alt={currentUser?.user_metadata?.raw_name || "Membro da Equipe"}
                    src={currentUser?.user_metadata?.role === 'barbeiro' 
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBROnOnhXtc-pnvgIhPVQy9GHLQYXvXuhVA_c2NaS_qh_meVth3C4hSdJL4fow8IuMNOGVsiNJkO6tpos7nqWONUK0M98qVXF0DTJ3wWkeVP00kmLD7sWHV8DQLYBZJO3bhDKXp0hegJCHtM8WFuXYWDbrhvxZlGoIFQpvBcuqQshzwD2ELYN5kAdmKJ1mk6teH1w5o2bDEVN3o9VD_IMNILo1EA-a4d7L9mSZmwWKjsvb17Z9X6k07QQ09XulJemy6HCtBuXE7QIc"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuCEe6N8a7kDVK96OuNzsF8B1KlG92y_ceAS651-BNVdcjzMI5bIoXXe7ElRRl6p3YmMg2rYN_IKrCavgvVQEU-dQPk08YT-eybzYzc_RarN-iLQiWtLmAXK2RQDIRV_t3iOfmc3LSAevFw18xXiuK62dJ4e_fBF5yUSkgUZjIDYIZ6BaM-slmUSSSgXbqZfYCBIfkOuM2pCk2OknJ9EOEtQacPAbTIbiphLp58JgM-N7f0qU6O34Qk-r0as2ARNnlNL_8abA6fBY_U"
                    }
                    fill
                    referrerPolicy="no-referrer"
                  />
                </div>
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden text-left">
                    <p className="font-label-md text-sm text-on-surface truncate">{currentUser?.user_metadata?.raw_name || "Membro Equipe"}</p>
                    <p className="text-[10px] text-on-surface-variant truncate uppercase tracking-widest font-bold">
                      {currentUser?.user_metadata?.role || "Gerente"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Panel Content Area */}
          <main className="flex-1 flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-16">
            
            {/* Header / Top bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 bg-background/85 backdrop-blur-xl border-b border-white/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-white/5 text-primary transition-colors shrink-0"
                  title="Toggle Sidebar Minimalist mode"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="font-display-lg text-headline-md font-bold text-on-surface hidden md:block">
                    Dashboard Administrativo
                  </h2>
                  <p className="text-body-sm text-on-surface-variant font-medium hidden md:block">
                    Bem-vindo de volta, Carlos! Aqui está o resumo do seu negócio.
                  </p>
                </div>
              </div>

              {/* Dynamic current date selector */}
              <div className="flex items-center gap-3">
                {/* Supabase Status Indicator Wrapper */}
                <button
                  onClick={() => {
                    setIsSqlModalOpen(true);
                    triggerToast('Painel de Configuração SQL do Supabase carregado.');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold uppercase transition-all shrink-0 cursor-pointer hover:scale-[1.02] ${
                    supabaseSync.connected
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 hover:bg-amber-500/15 text-ring-amber-500 text-amber-500 border-amber-500/20'
                  }`}
                  title="Visão Geral do banco Supabase local / nuvem"
                >
                  <span className={`w-2 h-2 rounded-full ${supabaseSync.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="hidden sm:inline">
                    {supabaseSync.connected ? 'Supabase Ativo' : 'Banco Setup'}
                  </span>
                  <span className="sm:hidden font-mono text-[10px]">DB Sync</span>
                </button>

                <button
                  onClick={() => triggerToast('O calendário operacional foi sincronizado para hoje.')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-on-surface-variant font-label-md hover:text-primary active:scale-95 text-xs font-semibold shrink-0"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  12 de Junho, 2024
                </button>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => triggerToast('Nenhuma notificação crítica pendente.')}
                    className="p-2 rounded-full glass-card hover:text-primary transition-all active:scale-90"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!supabase) {
                        triggerToast('Supabase não configurado. Nenhuma sessão ativa foi encontrada.');
                        setView('landing');
                        return;
                      }

                      try {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        triggerToast('Sessão encerrada com sucesso!');
                        setView('landing');
                      } catch (err: any) {
                        triggerToast(`Erro ao sair: ${err.message || err}`);
                        setView('landing');
                      }
                    }}
                    className="p-2 rounded-full glass-card hover:text-red-400 transition-all font-semibold text-xs flex items-center gap-1"
                    title="Sair como Administrador"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </header>

            {/* Inner Content Area */}
            <div className="px-6 md:px-8 pt-6 space-y-6">
              
              {/* Alert Ribbon regarding stock */}
              {pendingStockAlertsCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm font-semibold">
                      Atenção: Existem {pendingStockAlertsCount} alertas de materiais com estoque baixo crítico!
                    </p>
                  </div>
                  <a href="#estoque-alert" className="text-xs text-primary font-bold hover:underline shrink-0 pl-4">
                    Resolver alertas
                  </a>
                </div>
              )}

              {dashboardTab === 'dashboard' && (
                <>
                  {/* Stats Grid */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Revenue stat card */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-green-500 font-label-md text-xs font-bold flex items-center gap-1">
                      +18% <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                    Receita do dia
                  </p>
                  <h3 className="text-headline-md font-bold font-display text-on-surface mt-1">
                    € {totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-4 h-12 w-full relative z-10">
                    <svg className="w-full h-full stroke-primary fill-none stroke-2 chart-glow" viewBox="0 0 100 30">
                      <path d="M0,25 Q10,15 20,20 T40,10 T60,18 T80,5 T100,15"></path>
                    </svg>
                  </div>
                </div>

                {/* Schedulings count daily */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-green-500 font-label-md text-xs font-bold flex items-center gap-1">
                      +12% <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                    Agendamentos hoje
                  </p>
                  <h3 className="text-headline-md font-bold font-display text-on-surface mt-1">
                    {totalAgendamentosHoje}
                  </h3>
                  <div className="mt-4 h-12 w-full relative z-10">
                    <svg className="w-full h-full stroke-green-500 fill-none stroke-2" viewBox="0 0 100 30">
                      <path d="M0,20 Q15,25 30,10 T60,15 T100,5"></path>
                    </svg>
                  </div>
                </div>

                {/* Active Clients */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-green-500 font-label-md text-xs font-bold flex items-center gap-1">
                      +8% <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                    Clientes ativos
                  </p>
                  <h3 className="text-headline-md font-bold font-display text-on-surface mt-1">
                    {activeClientsCount}
                  </h3>
                  <div className="mt-4 h-12 w-full relative z-10">
                    <svg className="w-full h-full stroke-blue-500 fill-none stroke-2" viewBox="0 0 100 30">
                      <path d="M0,25 L20,20 L40,22 L60,10 L80,12 L100,5"></path>
                    </svg>
                  </div>
                </div>

                {/* Average Ticket */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-green-500 font-label-md text-xs font-bold flex items-center gap-1">
                      +10% <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                    Ticket médio
                  </p>
                  <h3 className="text-headline-md font-bold font-display text-on-surface mt-1">
                    € {averageTicket.toFixed(2)}
                  </h3>
                  <div className="mt-4 h-12 w-full relative z-10">
                    <svg className="w-full h-full stroke-purple-500 fill-none stroke-2" viewBox="0 0 100 30">
                      <path d="M0,20 Q20,20 40,5 T80,15 T100,10"></path>
                    </svg>
                  </div>
                </div>
              </section>

              {/* Graphic Plot Section */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main weekly revenue interactive spline chart */}
                <div className="lg:col-span-8 glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-headline-sm font-semibold text-on-surface">Faturamento Semanal</h4>
                      <p className="text-body-sm text-on-surface-variant">
                        Gráfico de entradas
                      </p>
                    </div>
                    <select
                      onChange={(e) => triggerToast(`Visualização mudou para Filtro de Tempo: "${e.target.value}"`)}
                      className="bg-surface-container-high border border-white/10 rounded-lg font-label-md text-sm text-on-surface px-4 py-2 focus:ring-1 focus:ring-primary transition-all hover:border-primary/50 cursor-pointer text-left"
                    >
                      <option value="semana" className="bg-[#1a1a1a] text-[#e5e2e1]">Esta semana</option>
                      <option value="mes" className="bg-[#1a1a1a] text-[#e5e2e1]">Último mês</option>
                    </select>
                  </div>

                  <div className="h-[280px] w-full relative flex flex-col justify-end">
                    <div className="flex-1 w-full flex items-end gap-2 pb-6 relative">
                      
                      {/* Spline area dynamic visualization */}
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f2ca50" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Gradient path shape */}
                        <path
                          d="M0,180 C50,160 100,140 150,150 S250,80 300,90 S400,120 450,110 S550,40 600,60 S700,20 700,20 V200 H0 Z"
                          fill="url(#chartGradient)"
                        />
                        {/* Glowing stroke */}
                        <path
                          className="chart-glow stroke-primary stroke-[3px] fill-none"
                          d="M0,180 C50,160 100,140 150,150 S250,80 300,90 S400,120 450,110 S550,40 600,60 S700,20 700,20"
                        />
                        
                        {/* Spline hoverable indicator circles */}
                        {weeklyData.map((node, index) => (
                          <g key={index}>
                            <circle
                              className="transition-all duration-150 cursor-pointer fill-primary stroke-background stroke-2 hover:r-6"
                              cx={node.coordinates.cx}
                              cy={node.coordinates.cy}
                              r={activeChartNode === index ? 7 : 4}
                              onMouseEnter={() => setActiveChartNode(index)}
                              onMouseLeave={() => setActiveChartNode(null)}
                              onClick={() => triggerToast(`Faturamento em ${node.day}: € ${node.revenue.toLocaleString('pt-BR')}`)}
                            />
                          </g>
                        ))}
                      </svg>

                      {/* Floating tooltip */}
                      {activeChartNode !== null && (
                        <div
                          className="absolute bg-surface-container-highest border border-primary/30 p-2.5 rounded-lg shadow-xl text-left pointer-events-none backdrop-blur-md"
                          style={{
                            left: `${weeklyData[activeChartNode].coordinates.cx / 7.1}%`,
                            top: `${weeklyData[activeChartNode].coordinates.cy - 70}px`,
                          }}
                        >
                          <p className="text-[10px] font-bold text-primary tracking-wide uppercase">
                            {weeklyData[activeChartNode].day} (Faturamento)
                          </p>
                          <p className="text-xs font-semibold text-white">
                            € {weeklyData[activeChartNode].revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <span className="text-[9px] text-green-400">Clique para ver detalhes</span>
                        </div>
                      )}
                    </div>

                    {/* Chart bottom labels */}
                    <div className="flex justify-between text-on-surface-variant font-semibold text-xs pt-4 border-t border-white/5">
                      {weeklyData.map((n, idx) => (
                        <span key={idx}>{n.day}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Donut chart widget "Servicos mais vendidos" */}
                <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col">
                  <h4 className="text-headline-sm font-semibold text-on-surface mb-8">Serviços mais vendidos</h4>
                  <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="relative w-44 h-44 mb-8 group cursor-pointer transition-transform duration-500 hover:scale-105">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#2a2a2a" strokeWidth="4" />
                        <circle
                          className="transition-all duration-1000"
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="15.915"
                          stroke="#f2ca50"
                          strokeWidth="4"
                          strokeDasharray="40 60"
                          strokeDashoffset="0"
                        />
                        <circle
                          className="transition-all duration-1000"
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="15.915"
                          stroke="#ffb4a8"
                          strokeWidth="4"
                          strokeDasharray="25 75"
                          strokeDashoffset="-40"
                        />
                        <circle
                          className="transition-all duration-1000"
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="15.915"
                          stroke="#bfcdff"
                          strokeWidth="4"
                          strokeDasharray="15 85"
                          strokeDashoffset="-65"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total</p>
                        <p className="text-headline-md font-bold text-white leading-none">320</p>
                        <p className="text-[9px] text-on-surface-variant">atendimentos</p>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      {[
                        { label: 'Corte Masculino', percent: '40%', color: 'bg-primary' },
                        { label: 'Barba', percent: '25%', color: 'bg-[#ffb4a8]' },
                        { label: 'Combo', percent: '15%', color: 'bg-[#bfcdff]' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium text-on-surface-variant">{item.label}</span>
                          </div>
                          <span className="text-on-surface font-semibold text-xs font-mono">{item.percent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Bottom Row grid widgets */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                
                {/* 1. Interactive appointments manager */}
                <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h4 className="font-display font-medium text-[16px] text-on-surface">Próximos agendamentos</h4>
                    <button
                      onClick={() => handleOpenBooking()}
                      className="text-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Appt
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-on-surface-variant w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Pesquisar agendamento..."
                        value={dashboardSearchQuery}
                        onChange={(e) => setDashboardSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                    {appointments
                      .filter((a) =>
                        a.clientName.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) ||
                        a.serviceName.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
                      )
                      .map((appt) => (
                        <div
                          key={appt.id}
                          className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all flex flex-col gap-2 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-bold text-primary shrink-0 bg-primary/10 px-2 py-1 rounded">
                              {appt.time}
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative shrink-0">
                              <Image
                                className="object-cover"
                                alt={appt.clientName}
                                src={appt.avatarUrl}
                                fill
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-on-surface truncate">
                                {appt.clientName}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                {appt.serviceName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                appt.status === 'Concluído'
                                  ? 'bg-green-500/15 text-green-400'
                                  : appt.status === 'Em andamento'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-indigo-500/15 text-indigo-400'
                              }`}
                            >
                              {appt.status}
                            </span>
                            <div className="flex gap-1">
                              {appt.status !== 'Concluído' && (
                                <button
                                  onClick={() => handleCompleteAppt(appt.id)}
                                  className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                  title="Marcar como Concluído"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveAppt(appt.id)}
                                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                title="Remover agendamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {appointments.length === 0 && (
                      <p className="text-xs text-on-surface-variant text-center py-8">
                        Nenhum agendamento ativo registrado.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Interactive Barbers Status Presence panel */}
                <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h4 className="font-display font-medium text-[16px] text-on-surface">Barbeiros online</h4>
                    <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
                      4 Ativos
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-on-surface-variant mb-3">
                    Clique em um barbeiro para ciclar a disponibilidade (Livre / Atendendo / Ausente):
                  </p>

                  <div className="space-y-3 overflow-y-auto">
                    {barbers.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleToggleBarber(b.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-white/5 hover:border-primary/20 bg-white/[0.01]"
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full border border-primary/20 relative">
                            <Image
                              className={`object-cover ${b.status === 'Ausente' ? 'grayscale opacity-50' : ''}`}
                              alt={b.name}
                              src={b.avatarUrl}
                              fill
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${
                              b.status === 'Livre'
                                ? 'bg-green-500'
                                : b.status === 'Atendendo'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-semibold text-on-surface truncate">{b.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {b.status} • {b.specialty}
                          </p>
                        </div>
                        <div className="text-[9px] font-bold text-on-surface-variant font-mono px-2 py-1 bg-white/5 rounded shrink-0">
                          {b.room}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Materials alerts low stock tracker */}
                <div id="estoque-alert" className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h4 className="font-display font-medium text-[16px] text-on-surface">Alertas de estoque</h4>
                    <span className="p-1 bg-error-container/30 rounded text-error text-[10px] font-bold">
                      {pendingStockAlertsCount} Alertas
                    </span>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto">
                    {stockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between group p-2 rounded-xl bg-white/[0.01] hover:bg-white/5 border border-white/5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              item.status === 'Estoque crítico'
                                ? 'bg-error-container/30 text-error'
                                : 'bg-white/5 text-primary'
                            }`}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-on-surface">{item.name}</p>
                            <p
                              className={`text-[10px] font-semibold ${
                                item.status === 'Estoque crítico' ? 'text-red-400 uppercase tracking-wider' : 'text-amber-500'
                              }`}
                            >
                              {item.status} ({item.quantity} un)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedRestockItem(item)}
                          className="p-1.5 hover:bg-primary/20 text-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Repor estoque deste material"
                        >
                          <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Financial overview, interactive revenue details */}
                <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col bg-gradient-to-br from-white/5 to-transparent h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h4 className="font-display font-medium text-[16px] text-on-surface">Visão geral do mês</h4>
                    <button
                      onClick={() => setIsFinancialModalOpen(true)}
                      className="p-1 bg-primary/20 text-primary rounded hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                      title="Adicionar Faturamento/Despesa manual"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-6 text-left">
                    <div className="group cursor-default">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-on-surface-variant font-medium text-[10px] uppercase tracking-wider">
                          Faturamento
                        </span>
                        <span className="text-green-500 text-[11px] font-bold inline-flex items-center gap-0.5">
                          +12% <TrendingUp className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold font-display text-on-surface group-hover:text-primary transition-colors">
                        € {finances.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full shadow-[0_0_12px_#f2ca50] transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (finances.faturamento / 60000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="group cursor-default">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-on-surface-variant font-medium text-[10px] uppercase tracking-wider">
                          Despesas
                        </span>
                        <span className="text-red-400 text-[11px] font-bold">-5%</span>
                      </div>
                      <p className="text-xl font-bold font-display text-on-surface group-hover:text-red-400 transition-colors">
                        € {finances.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full shadow-[0_0_12px_#ef4444] transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (finances.despesas / 30000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-semibold text-[10px] uppercase tracking-wider">
                          Lucro Líquido
                        </span>
                        <p className="text-xl font-bold text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] font-mono">
                          € {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
                </>
              )}

              {/* Conditionally Render Other Dynamic Views */}
              {dashboardTab === 'agenda' && (
                <AgendaView
                  selectedAgendaDate={selectedAgendaDate}
                  setSelectedAgendaDate={setSelectedAgendaDate}
                  barbers={barbers}
                  appointments={appointments}
                  handleCompleteAppt={handleCompleteAppt}
                  handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  setBookingFormData={setBookingFormData}
                  setIsSchedulingsOpen={setIsSchedulingsOpen}
                  triggerToast={triggerToast}
                  setAuditLogs={setAuditLogs}
                />
              )}

              {dashboardTab === 'agendamentos' && (
                <AgendamentosView
                  appointments={appointments}
                  clientSearchFilter={clientSearchFilter}
                  setClientSearchFilter={setClientSearchFilter}
                  activeStatusFilter={activeStatusFilter}
                  setActiveStatusFilter={setActiveStatusFilter}
                  handleCompleteAppt={handleCompleteAppt}
                  handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  handleRemoveAppt={handleRemoveAppt}
                  barbers={barbers}
                  handleOpenBooking={handleOpenBooking}
                  triggerToast={triggerToast}
                  setAuditLogs={setAuditLogs}
                />
              )}

              {dashboardTab === 'clientes' && (
                <ClientesView
                  clients={clients}
                  setClients={setClients}
                  clientSearchFilter={clientSearchFilter}
                  setClientSearchFilter={setClientSearchFilter}
                  isClientFormExpanded={isClientFormExpanded}
                  setIsClientFormExpanded={setIsClientFormExpanded}
                  clientFormState={clientFormState}
                  setClientFormState={setClientFormState}
                  setActiveClientsCount={setActiveClientsCount}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                  averageTicket={averageTicket}
                />
              )}

              {dashboardTab === 'barbeiros' && (
                <BarbeirosView
                  barbers={barbers}
                  setBarbers={setBarbers}
                  appointments={appointments}
                  isBarberFormExpanded={isBarberFormExpanded}
                  setIsBarberFormExpanded={setIsBarberFormExpanded}
                  newBarberForm={newBarberForm}
                  setNewBarberForm={setNewBarberForm}
                  barberCommission={barberCommission}
                  setBarberCommission={setBarberCommission}
                  handleToggleBarber={handleToggleBarber}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                />
              )}

              {dashboardTab === 'servicos' && (
                <ServicosView
                  services={services}
                  setServices={setServices}
                  isServiceFormExpanded={isServiceFormExpanded}
                  setIsServiceFormExpanded={setIsServiceFormExpanded}
                  newServiceForm={newServiceForm}
                  setNewServiceForm={setNewServiceForm}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                />
              )}

              {dashboardTab === 'caixa' && (
                <CaixaView
                  lucroLiquido={lucroLiquido}
                  finances={finances}
                  setFinances={setFinances}
                  cashRegisterStatus={cashRegisterStatus}
                  setCashRegisterStatus={setCashRegisterStatus}
                  cashTransactions={cashTransactions}
                  setCashTransactions={setCashTransactions}
                  transactionSearchQuery={transactionSearchQuery}
                  setTransactionSearchQuery={setTransactionSearchQuery}
                  transactionTypeFilter={transactionTypeFilter}
                  setTransactionTypeFilter={setTransactionTypeFilter}
                  setIsFinancialModalOpen={setIsFinancialModalOpen}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                />
              )}

              {dashboardTab === 'controle' && (
                <ControleView
                  dailyTarget={dailyTarget}
                  setDailyTarget={setDailyTarget}
                  setAppointments={setAppointments}
                  setCashTransactions={setCashTransactions}
                  setFinances={setFinances}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  barbers={barbers}
                  triggerToast={triggerToast}
                />
              )}

              {dashboardTab === 'estoque' && (
                <EstoqueView
                  stockItems={stockItems}
                  setStockItems={setStockItems}
                  inventorySearchQuery={inventorySearchQuery}
                  setInventorySearchQuery={setInventorySearchQuery}
                  isProductFormExpanded={isProductFormExpanded}
                  setIsProductFormExpanded={setIsProductFormExpanded}
                  newProductForm={newProductForm}
                  setNewProductForm={setNewProductForm}
                  setSelectedRestockItem={setSelectedRestockItem}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                />
              )}

              {dashboardTab === 'fidelizacao' && (
                <FidelizacaoView
                  clients={clients}
                  setClients={setClients}
                  loyaltyRewardSelection={loyaltyRewardSelection}
                  setLoyaltyRewardSelection={setLoyaltyRewardSelection}
                  setAuditLogs={setAuditLogs}
                  triggerToast={triggerToast}
                />
              )}
            </div>
          </main>
        </div>
      ))}

      {view === 'superadmin' && (
        !currentUser ? (
          <AuthOverlay
            targetView="superadmin"
            onSuccess={(usr) => {
              setCurrentUser(usr);
              triggerToast('Painel de controle Super Admin SaaS carregado com sucesso!');
            }}
            onCancel={() => setView('landing')}
            triggerToast={triggerToast}
          />
        ) : !isSuperAdmin(currentUser) ? (
          <AccessDeniedView
            requiredRoles={['gerente']}
            onBack={() => setView('landing')}
            triggerToast={triggerToast}
          />
        ) : (
          <SuperAdminView
            onBackToMain={() => setView('landing')}
            triggerToast={triggerToast}
          />
        )
      )}

      {/* MODAL DE AGENDAMENTO (SCHEDULING FLOW) */}
      <AnimatePresence>
        {isSchedulingsOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSchedulingsOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface-container-low border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl z-10 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  <h3 className="font-display-lg text-headline-sm font-bold text-on-surface">
                    Agendar Horário Premium
                  </h3>
                </div>
                <button
                  onClick={() => setIsSchedulingsOpen(false)}
                  className="p-1 px-2 hover:bg-white/5 rounded-md text-on-surface-variant font-mono"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4 text-left">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={bookingFormData.name}
                    onChange={(e) => setBookingFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Serviço Premium
                    </label>
                    <select
                      value={bookingFormData.serviceId}
                      onChange={(e) => setBookingFormData((p) => ({ ...p, serviceId: e.target.value }))}
                      className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-left"
                    >
                      {services.map((srv) => (
                        <option key={srv.id} value={srv.id} className="bg-[#1a1a1a] text-[#e5e2e1]">
                          {srv.name} (€ {srv.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Barber */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Barbeiro Especialista
                    </label>
                    <select
                      value={bookingFormData.barberId}
                      onChange={(e) => setBookingFormData((p) => ({ ...p, barberId: e.target.value }))}
                      className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-left"
                    >
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id} className="bg-[#1a1a1a] text-[#e5e2e1]">
                          {b.name} ({b.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date / Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingFormData.date}
                      onChange={(e) => setBookingFormData((p) => ({ ...p, date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Horário
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 14:30"
                      value={bookingFormData.time}
                      onChange={(e) => setBookingFormData((p) => ({ ...p, time: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Preço Total Estimado</p>
                    <p className="text-lg font-bold text-primary font-mono">
                      € {(services.find((s) => s.id === bookingFormData.serviceId)?.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">
                    Sincronizado Instantaneamente
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
                >
                  Confirmar Agendamento Premium
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE MANUAL FINANCIAL ENTRY */}
      <AnimatePresence>
        {isFinancialModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinancialModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              className="relative w-full max-w-md bg-surface-container-low border border-white/10 p-6 rounded-2xl shadow-2xl z-10 text-left"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Lançamento Financeiro Manual
                </h3>
                <button
                  onClick={() => setIsFinancialModalOpen(false)}
                  className="p-1 px-2 hover:bg-white/5 text-xs text-on-surface-variant font-mono"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleFinancialSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Tipo do Lançamento
                  </label>
                  <select
                    value={financialForm.type}
                    onChange={(e) => setFinancialForm((p) => ({ ...p, type: e.target.value as 'faturamento' | 'despesas' }))}
                    className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface cursor-pointer text-left"
                  >
                    <option value="faturamento" className="bg-[#1a1a1a] text-[#e5e2e1]">Entrada / Faturamento (+)</option>
                    <option value="despesas" className="bg-[#1a1a1a] text-[#e5e2e1]">Saída / Despesa (-)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Valor (€)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="Ex: 1500.00"
                    value={financialForm.amount}
                    onChange={(e) => setFinancialForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Observação / Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Venda de Shampoos ou Parcela de Aluguel"
                    value={financialForm.description}
                    onChange={(e) => setFinancialForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all text-sm cursor-pointer"
                >
                  Registrar Lançamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESTOCK DIALOG CONFIRMATION */}
      <AnimatePresence>
        {selectedRestockItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRestockItem(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              className="relative w-full max-w-sm bg-surface-container-low border border-white/10 p-6 rounded-2xl shadow-2xl z-10 text-center space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center text-primary">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display-lg text-lg font-bold text-on-surface">
                  Reposição de Material
                </h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Deseja adicionar +10 unidades ao produto{' '}
                  <span className="text-primary font-bold">{selectedRestockItem.name}</span>?
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setSelectedRestockItem(null)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-white transition-opacity"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRestock(selectedRestockItem)}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 shadow-lg"
                >
                  Adicionar Estoque
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPABASE SQL INITIALIZATION DIALOG */}
      <AnimatePresence>
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              className="relative w-full max-w-2xl bg-[#111110] border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl z-20 space-y-6 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display-lg text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Cloud Database
                  </h3>
                  <p className="text-stone-400 text-xs mt-1">
                    Sua aplicação está conectada ao projeto Supabase <code className="text-amber-500 font-mono">hxpgjgdiimpudjttbhhh</code>.
                  </p>
                </div>
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="p-1 px-2.5 bg-neutral-900 border border-white/5 text-stone-400 hover:text-white rounded-lg text-xs"
                >
                  Fechar
                </button>
              </div>

              {/* Table Sync Status Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                {Object.entries({
                  Clientes: 'clients',
                  Barbeiros: 'barbers',
                  Serviços: 'services',
                  Agendamentos: 'appointments',
                  Transações: 'transactions',
                  Estoque: 'stock_items'
                }).map(([label, dbName]) => {
                  const checkWorking = supabaseSync.connected;
                  return (
                    <div key={dbName} className="flex items-center gap-2.5 text-xs">
                      <div className={`w-2 h-2 rounded-full ${checkWorking ? 'bg-emerald-500 animate-pulse' : 'bg-stone-600'}`} />
                      <div>
                        <span className="block text-stone-300 font-bold">{label}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {checkWorking ? 'Sincronizado' : 'Aguardando'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SQL instructions */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-stone-200">
                  <span>Script de Migração SQL Supabase</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                      triggerToast('Script de configuração SQL copiado para a área de transferência!');
                    }}
                    className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/15 cursor-pointer font-semibold uppercase tracking-wider transition-all"
                  >
                    Copiar Script
                  </button>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Para utilizar seu banco reais por completo, abra o seu painel de controle do Supabase, clique em <strong className="text-white">SQL Editor</strong>, crie uma nova query, cole o script a seguir e clique em <strong className="text-emerald-400">Run</strong>.
                </p>
                <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <pre className="text-[11px] font-mono text-stone-400 max-h-48 overflow-y-auto custom-scrollbar select-text selection:bg-emerald-500/30">
                    {SUPABASE_SETUP_SQL}
                  </pre>
                </div>
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-xs text-emerald-400/90 leading-relaxed">
                <strong>💡 Recursos Ativos do Sincronizador:</strong> Ao realizar ações como agendamento de horários, reposição de estoque, trocas de status, e encerramentos de conta, o sistema sincronizará os dados de forma instantânea com a nuvem do Supabase, possuindo tolerância a falhas para continuar operando localmente se a rede oscilar.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
