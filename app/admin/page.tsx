'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  AgendaView,
  AgendamentosView,
  ClientesView,
  BarbeirosView,
  ServicosView,
  CaixaView,
  ControleView,
  EstoqueView,
  FidelizacaoView,
  SuporteView,
} from '../../components/dashboard-views';
import { AuthOverlay, AccessDeniedView } from '../../components/auth-views';
import { supabase } from '../../lib/supabase';
import {
  loadTableData,
  saveRow,
  deleteRow,
  getSyncStatus,
  SUPABASE_SETUP_SQL,
  getShopStatusForUser,
  loadShopPage,
  saveShopPage,
  updateShopSlug,
  uploadImage,
  type ShopPage,
} from '../../lib/supabase-service';
import {
  Scissors, LayoutDashboard, Calendar, FileText, Users, UserCheck,
  Sparkles, DollarSign, Wallet, Package, Award, TrendingUp,
  Bell, Search, Check, Smile, Clipboard, Palette, Heart,
  Star, ChevronRight, AlertTriangle, Plus, Coffee,
  Menu, CheckCircle2, Trash2, LogOut, Globe, ExternalLink,
  Copy, Save, LifeBuoy,
} from 'lucide-react';

// ---------- interfaces ----------
interface Appointment {
  id: string; time: string; date?: string; clientName: string; serviceName: string;
  price: number; status: 'Confirmado' | 'Em andamento' | 'Concluído' | 'Cancelado';
  avatarUrl: string; barberId?: string;
}
interface Barber {
  id: string; name: string; specialty: string; room: string;
  status: 'Atendendo' | 'Ausente' | 'Livre'; rating: number;
  reviewsCount: number; avatarUrl: string;
}
interface StockItem {
  id: string; name: string;
  status: 'Estoque baixo' | 'Estoque crítico' | 'Estoque normal';
  quantity: number; category: 'inventory' | 'soap' | 'warning';
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  scissors: Scissors, smile: Smile, sparkles: Sparkles, clipboard: Clipboard,
  palette: Palette, heart: Heart, award: Award, star: Star, coffee: Coffee, package: Package,
};

const TODAY = new Date().toISOString().split('T')[0];

function formatDatePtBR(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]}, ${y}`;
}

export default function AdminPage() {
  const router = useRouter();

  // --- Auth ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shopStatus, setShopStatus] = useState<{ status: string; trial_end_at: string | null; shop_name: string } | null>(null);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load shop status once authenticated
  useEffect(() => {
    if (!currentUser) return;
    getShopStatusForUser().then(s => setShopStatus(s ? { status: s.status, trial_end_at: s.trial_end_at, shop_name: s.shop_name } : null));
  }, [currentUser]);

  // --- Toast ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- Dashboard navigation ---
  const [dashboardTab, setDashboardTab] = useState<
    'dashboard' | 'agenda' | 'agendamentos' | 'clientes' | 'barbeiros' |
    'servicos' | 'caixa' | 'controle' | 'estoque' | 'fidelizacao' | 'pagina-publica' | 'suporte'
  >('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Supabase sync ---
  const [supabaseSync, setSupabaseSync] = useState<{ connected: boolean; message: string; source: 'supabase' | 'local' }>({
    connected: false, message: 'Aguardando nuvem...', source: 'local',
  });
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // --- Data ---
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cashRegisterStatus, setCashRegisterStatus] = useState<'aberto' | 'fechado'>('aberto');
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [finances, setFinances] = useState({ faturamento: 0, despesas: 0 });
  const [dailyTarget, setDailyTarget] = useState(5000);
  const [activeClientsCount, setActiveClientsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  // --- Shop Page (public page config) ---
  const [shopPage, setShopPage] = useState<ShopPage | null>(null);
  const [shopPageForm, setShopPageForm] = useState<Partial<ShopPage>>({});
  const [shopPageSaving, setShopPageSaving] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const coverUploadRef = useRef<HTMLInputElement>(null);

  // Load data once authenticated
  useEffect(() => {
    if (!supabase || !currentUser) return;
    let isMounted = true;
    async function loadAll() {
      try {
        const syncStatus = await getSyncStatus();
        if (!isMounted) return;
        const [resSvc, resCli, resTrans, resBarbers, resStock, resAppts] = await Promise.all([
          loadTableData<any>('services', []),
          loadTableData<any>('clients', []),
          loadTableData<any>('transactions', []),
          loadTableData<Barber>('barbers', []),
          loadTableData<StockItem>('stock_items', []),
          loadTableData<Appointment>('appointments', []),
        ]);
        if (!isMounted) return;
        setServices(resSvc.data);
        setClients(resCli.data);
        setActiveClientsCount(resCli.data.length);
        setCashTransactions(resTrans.data);
        const totFat = resTrans.data.filter((t: any) => t.type === 'faturamento').reduce((s: number, t: any) => s + t.amount, 0);
        const totDes = resTrans.data.filter((t: any) => t.type === 'despesas').reduce((s: number, t: any) => s + t.amount, 0);
        setFinances({ faturamento: totFat, despesas: totDes });
        setBarbers(resBarbers.data);
        setStockItems(resStock.data);
        setAppointments(resAppts.data);
        setSupabaseSync({ connected: syncStatus.connected, message: syncStatus.message, source: resSvc.source });
        const page = await loadShopPage();
        if (page && isMounted) {
          setShopPage(page);
          setShopPageForm(page);
          setSlugInput(page.slug || '');
        }
      } catch (err) { console.error('Falha ao carregar dados Supabase:', err); }
    }
    loadAll();

    // Realtime: appointments INSERT/UPDATE/DELETE
    const channel = supabase!
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        async () => {
          if (!isMounted) return;
          const res = await loadTableData<Appointment>('appointments', []);
          if (isMounted) setAppointments(res.data);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase!.removeChannel(channel);
    };
  }, [currentUser]);

  // --- Derived state ---
  const averageTicket = useMemo(() => {
    const fms = cashTransactions.filter((t: any) => t.type === 'faturamento');
    if (!fms.length) return 0;
    return fms.reduce((s: number, t: any) => s + Number(t.amount || 0), 0) / fms.length;
  }, [cashTransactions]);
  const totalAgendamentosHoje = useMemo(() => appointments.filter((a) => a.status !== 'Concluído').length, [appointments]);
  const totalReceitaDia = useMemo(() => appointments.filter((a) => a.status === 'Concluído').reduce((s, a) => s + a.price, 0), [appointments]);
  const lucroLiquido = useMemo(() => finances.faturamento - finances.despesas, [finances]);
  const pendingStockAlertsCount = useMemo(() => stockItems.filter((s) => s.status !== 'Estoque normal').length, [stockItems]);

  // --- Modals ---
  const [isSchedulingsOpen, setIsSchedulingsOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({ name: '', serviceId: '', barberId: '', date: TODAY, time: '14:30' });
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialForm, setFinancialForm] = useState({ type: 'faturamento' as 'faturamento' | 'despesas', amount: '', description: '' });
  const [selectedRestockItem, setSelectedRestockItem] = useState<StockItem | null>(null);
  const [activeChartNode, setActiveChartNode] = useState<number | null>(null);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');

  // View-specific state
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(TODAY);
  const [activeStatusFilter, setActiveStatusFilter] = useState('Todos');
  const [clientSearchFilter, setClientSearchFilter] = useState('');
  const [clientFormState, setClientFormState] = useState({ name: '', email: '', phone: '' });
  const [isClientFormExpanded, setIsClientFormExpanded] = useState(false);
  const [barberCommission, setBarberCommission] = useState(50);
  const [newBarberForm, setNewBarberForm] = useState({ name: '', specialty: '', room: 'Sala 05' });
  const [isBarberFormExpanded, setIsBarberFormExpanded] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({ name: '', price: '', duration: '30 min', description: '', barberId: '' });
  const [isServiceFormExpanded, setIsServiceFormExpanded] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'Todos' | 'faturamento' | 'despesas'>('Todos');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [newProductForm, setNewProductForm] = useState({ name: '', quantity: 10 });
  const [isProductFormExpanded, setIsProductFormExpanded] = useState(false);
  const [loyaltyRewardSelection, setLoyaltyRewardSelection] = useState('corte-gratis');

  // Weekly chart data — computed from real transactions
  const weeklyData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const xPositions = [40, 150, 250, 360, 470, 580, 680];
    // Get Mon–Sun of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const weekRevenue: number[] = Array(7).fill(0);
    cashTransactions.forEach((t: any) => {
      if (t.type !== 'faturamento') return;
      const d = new Date(t.date);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 0 || diff > 6) return;
      const idx = (dayOfWeek - diff + 7) % 7;
      weekRevenue[idx] += Number(t.amount || 0);
    });
    const maxRev = Math.max(...weekRevenue, 1);
    const chartHeight = 180;
    const minCy = 20;
    return days.map((day, i) => {
      const revenue = weekRevenue[i];
      const cy = chartHeight - Math.round(((revenue / maxRev) * (chartHeight - minCy - 20)) + minCy);
      return { day, revenue, coordinates: { cx: xPositions[i], cy } };
    });
  }, [cashTransactions]);

  // Top services by appointment count
  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => { counts[a.serviceName] = (counts[a.serviceName] || 0) + 1; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ label: name, percent: Math.round((count / total) * 100) }));
  }, [appointments]);

  const totalAtendimentos = appointments.length;

  // --- Handlers ---
  const handleOpenBooking = (serviceId?: string) => {
    setBookingFormData((prev) => ({ ...prev, serviceId: serviceId || services[0]?.id || '', barberId: barbers[0]?.id || '' }));
    setIsSchedulingsOpen(true);
  };

  const handleUpdateAppointmentStatus = (apptId: string, newStatus: Appointment['status']) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => a.id === apptId ? { ...a, status: newStatus } : a);
      const target = updated.find((a) => a.id === apptId);
      if (target) saveRow('appointments', target);
      return updated;
    });
    triggerToast(`Status atualizado para "${newStatus}"!`);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFormData.name.trim()) { triggerToast('Por favor, informe seu nome!'); return; }
    const selectedService = services.find((s) => s.id === bookingFormData.serviceId) || services[0];
    const selectedBarber = barbers.find((b) => b.id === bookingFormData.barberId) || barbers[0];
    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`, time: bookingFormData.time, clientName: bookingFormData.name,
      serviceName: selectedService.name, price: selectedService.price, status: 'Confirmado',
      avatarUrl: '',
      barberId: bookingFormData.barberId || barbers[0]?.id,
    };
    setAppointments((prev) => [newAppointment, ...prev]);
    saveRow('appointments', newAppointment);
    setFinances((prev) => ({ ...prev, faturamento: prev.faturamento + selectedService.price }));
    const newTrans = { id: `t-${Date.now()}`, type: 'faturamento' as const, amount: selectedService.price, description: `Agendamento: ${selectedService.name} - ${bookingFormData.name}`, date: bookingFormData.date, category: 'Serviço' };
    setCashTransactions((prev) => [newTrans, ...prev]);
    saveRow('transactions', newTrans);
    setClients((prev) => {
      const match = prev.find((c) => c.name.toLowerCase() === bookingFormData.name.toLowerCase());
      if (match) { const ucl = { ...match, sales: match.sales + 1, spent: match.spent + selectedService.price, loyaltyPoints: match.loyaltyPoints + selectedService.price, lastVisit: bookingFormData.date }; saveRow('clients', ucl); return prev.map((c) => c.id === match.id ? ucl : c); }
      const ncl = { id: `cli-${Date.now()}`, name: bookingFormData.name, email: `${bookingFormData.name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`, phone: '+351 912 000 000', sales: 1, spent: selectedService.price, loyaltyPoints: selectedService.price, lastVisit: bookingFormData.date };
      saveRow('clients', ncl); return [...prev, ncl];
    });
    triggerToast(`Agendamento de ${selectedService.name} com ${selectedBarber?.name} às ${bookingFormData.time} CONFIRMADO!`);
    setIsSchedulingsOpen(false);
    setBookingFormData({ name: '', serviceId: '', barberId: '', date: TODAY, time: '14:30' });
  };

  const handleRestock = (item: StockItem) => {
    setStockItems((prev) => { const updated = prev.map((s) => s.id === item.id ? { ...s, status: 'Estoque normal' as const, quantity: s.quantity + 10 } : s); const target = updated.find((s) => s.id === item.id); if (target) saveRow('stock_items', target); return updated; });
    triggerToast(`${item.name} reabastecido! (+10 unidades)`);
    setSelectedRestockItem(null);
  };

  const handleToggleBarber = (barberId: string) => {
    setBarbers((prev) => { const updated = prev.map((b) => { if (b.id === barberId) { const cycle: Barber['status'][] = ['Livre', 'Atendendo', 'Ausente']; return { ...b, status: cycle[(cycle.indexOf(b.status) + 1) % cycle.length] }; } return b; }); const target = updated.find((b) => b.id === barberId); if (target) saveRow('barbers', target); return updated; });
    triggerToast('Disponibilidade atualizada!');
  };

  const handleCompleteAppt = (id: string) => {
    setAppointments((prev) => prev.map((a) => {
      if (a.id === id) {
        if (a.status !== 'Concluído') {
          const newT = { id: `t-comp-${Date.now()}`, type: 'faturamento' as const, amount: a.price, description: `Concluído: ${a.serviceName} - ${a.clientName}`, date: TODAY, category: 'Serviço' };
          setCashTransactions((t) => [newT, ...t]); saveRow('transactions', newT);
          setClients((cl) => cl.map((c) => { if (c.name.toLowerCase() === a.clientName.toLowerCase()) { const ucl = { ...c, loyaltyPoints: c.loyaltyPoints + a.price, spent: c.spent + a.price, sales: c.sales + 1 }; saveRow('clients', ucl); return ucl; } return c; }));
        }
        const updated = { ...a, status: 'Concluído' as const }; saveRow('appointments', updated); return updated;
      }
      return a;
    }));
    triggerToast('Atendimento concluído e pontos creditados!');
  };

  const handleRemoveAppt = (id: string) => { setAppointments((prev) => prev.filter((a) => a.id !== id)); deleteRow('appointments', id); triggerToast('Agendamento removido.'); };

  const handleFinancialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(financialForm.amount);
    if (isNaN(val) || val <= 0) { triggerToast('Informe uma quantia válida!'); return; }
    if (financialForm.type === 'faturamento') { setFinances((prev) => ({ ...prev, faturamento: prev.faturamento + val })); triggerToast(`Faturamento incrementado em € ${val.toFixed(2)}`); }
    else { setFinances((prev) => ({ ...prev, despesas: prev.despesas + val })); triggerToast(`Despesas incrementadas em € ${val.toFixed(2)}`); }
    setIsFinancialModalOpen(false); setFinancialForm({ type: 'faturamento', amount: '', description: '' });
  };

  const handleLogout = async () => {
    if (supabase) { await supabase.auth.signOut().catch(() => {}); }
    router.push('/');
  };

  // --- Loading / Auth gate ---
  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Scissors className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  );

  if (!currentUser) return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4">
            <div className="bg-surface-container-high border border-primary/40 backdrop-blur-xl px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <Scissors className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm font-semibold text-on-surface line-clamp-2">{toastMessage}</p>
              <button onClick={() => setToastMessage(null)} className="ml-auto text-on-surface-variant p-1 rounded-md"><span className="text-xs font-bold font-mono">X</span></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthOverlay
        targetView="dashboard"
        onSuccess={(usr) => { setCurrentUser(usr); triggerToast('Painel administrativo carregado!'); }}
        onCancel={() => router.push('/')}
        triggerToast={triggerToast}
      />
    </>
  );

  if (currentUser?.user_metadata?.role !== 'gerente' && currentUser?.user_metadata?.role !== 'barbeiro') return (
    <AccessDeniedView requiredRoles={['gerente', 'barbeiro']} onBack={() => router.push('/')} triggerToast={triggerToast} />
  );

  // Shop approval gate
  if (shopStatus && shopStatus.status === 'Pending') return (
    <div className="min-h-screen bg-[#0d0d0c] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#111110] border border-amber-500/20 rounded-2xl p-8 space-y-4">
        <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <Scissors className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif text-stone-100">Aguardando Aprovação</h2>
        <p className="text-stone-400 text-sm leading-relaxed">
          A sua barbearia <strong className="text-amber-500">{shopStatus.shop_name}</strong> foi registada com sucesso e está a aguardar a aprovação do administrador da plataforma.
        </p>
        <p className="text-stone-600 text-xs">Receberá uma notificação assim que a conta for aprovada. Normalmente em até 24h.</p>
        <button onClick={handleLogout} className="mt-4 text-xs text-stone-500 hover:text-stone-300 underline cursor-pointer">Sair</button>
      </div>
    </div>
  );

  if (shopStatus && shopStatus.status === 'Suspended') return (
    <div className="min-h-screen bg-[#0d0d0c] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#111110] border border-rose-500/20 rounded-2xl p-8 space-y-4">
        <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif text-stone-100">Conta Suspensa</h2>
        <p className="text-stone-400 text-sm leading-relaxed">
          O acesso à barbearia <strong className="text-rose-400">{shopStatus.shop_name}</strong> foi suspenso.
          Entre em contacto com o suporte da plataforma para mais informações.
        </p>
        <button onClick={handleLogout} className="mt-4 text-xs text-stone-500 hover:text-stone-300 underline cursor-pointer">Sair</button>
      </div>
    </div>
  );

  // Trial banner values
  const trialDaysLeft = shopStatus?.trial_end_at
    ? Math.ceil((new Date(shopStatus.trial_end_at).getTime() - Date.now()) / 86400000)
    : null;
  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft <= 7;

  return (
    <div className="relative min-h-screen custom-scrollbar">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4">
            <div className="bg-surface-container-high border border-primary/40 backdrop-blur-xl px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3">
              <div className="p-1.5 bg-primary/20 rounded-lg text-primary shrink-0"><Scissors className="w-5 h-5" /></div>
              <p className="text-sm font-semibold tracking-wide text-on-surface line-clamp-2">{toastMessage}</p>
              <button onClick={() => setToastMessage(null)} className="ml-auto text-on-surface-variant hover:text-on-surface p-1 rounded-md"><span className="text-xs font-bold font-mono">X</span></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`hidden md:flex flex-col barberly-sidebar h-full overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out shrink-0 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
          <div className="p-6 flex items-center gap-3 border-b border-[#2A2119]">
            <img src="/barberly_logo.png" alt="Barberly" className={`object-contain shrink-0 ${isSidebarCollapsed ? 'h-8 w-8' : 'h-10 w-auto max-w-[140px]'}`}
              onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling && ((el.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
            {!isSidebarCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="overflow-hidden hidden">
                <h1 className="font-display-lg text-headline-sm font-bold text-primary leading-none whitespace-nowrap">Barberly</h1>
                <p className="text-[10px] text-on-surface-variant uppercase font-medium tracking-widest mt-1 whitespace-nowrap">Admin Panel</p>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 px-3 mt-6 space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
              { icon: Calendar, label: 'Agenda', id: 'agenda' },
              { icon: FileText, label: 'Agendamentos', id: 'agendamentos' },
              { icon: Users, label: 'Clientes', id: 'clientes' },
              { icon: UserCheck, label: 'Barbeiros', id: 'barbeiros' },
              { icon: Sparkles, label: 'Serviços', id: 'servicos' },
            ].map((item) => {
              const NavIcon = item.icon;
              const isActive = dashboardTab === item.id;
              return (
                <button key={item.id} onClick={() => { setDashboardTab(item.id as any); triggerToast(`Painel "${item.label}" carregado.`); }}
                  className={`relative w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group overflow-hidden ${isActive ? 'text-primary font-semibold bg-[rgba(200,154,99,0.08)]' : 'text-on-surface-variant/80 hover:bg-[rgba(200,154,99,0.04)] hover:text-on-surface'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm"
                      style={{ background: '#C89A63', boxShadow: '0 0 10px rgba(200,154,99,0.35)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
                    />
                  )}
                  <NavIcon className={`relative z-10 w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                  {!isSidebarCollapsed && <span className="relative z-10 font-label-md text-sm truncate">{item.label}</span>}
                </button>
              );
            })}

            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{!isSidebarCollapsed ? 'Financeiro' : '---'}</div>
            {[{ icon: DollarSign, label: 'Caixa', id: 'caixa' }, { icon: Wallet, label: 'Controle', id: 'controle' }].map((item) => {
              const Icon = item.icon; const isActive = dashboardTab === item.id;
              return (
                <button key={item.id} onClick={() => { setDashboardTab(item.id as any); triggerToast(`Ativando "${item.label}".`); }}
                  className={`relative w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group overflow-hidden ${isActive ? 'text-primary font-semibold bg-[rgba(200,154,99,0.08)]' : 'text-on-surface-variant/80 hover:bg-[rgba(200,154,99,0.04)] hover:text-on-surface'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm"
                      style={{ background: '#C89A63', boxShadow: '0 0 10px rgba(200,154,99,0.35)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                  {!isSidebarCollapsed && <span className="relative z-10 font-label-md text-sm">{item.label}</span>}
                </button>
              );
            })}

            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{!isSidebarCollapsed ? 'Gestão' : '---'}</div>
            {[{ icon: Package, label: 'Estoque', id: 'estoque' }, { icon: Award, label: 'Fidelização', id: 'fidelizacao' }, { icon: Globe, label: 'Página Pública', id: 'pagina-publica' }, { icon: LifeBuoy, label: 'Suporte', id: 'suporte' }].map((item) => {
              const Icon = item.icon; const isActive = dashboardTab === item.id;
              return (
                <button key={item.id} onClick={() => { setDashboardTab(item.id as any); triggerToast(`Acessando "${item.label}".`); }}
                  className={`relative w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group overflow-hidden ${isActive ? 'text-primary font-semibold bg-[rgba(200,154,99,0.08)]' : 'text-on-surface-variant/80 hover:bg-[rgba(200,154,99,0.04)] hover:text-on-surface'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-y-0 left-0 w-[3px] rounded-r-sm"
                      style={{ background: '#C89A63', boxShadow: '0 0 10px rgba(200,154,99,0.35)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} />
                  {!isSidebarCollapsed && <span className="relative z-10 font-label-md text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-[#2A2119] space-y-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all font-semibold cursor-pointer">
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-label-md text-sm">Terminar Sessão</span>}
            </button>
            <div className="flex items-center gap-3 p-3 bg-[rgba(200,154,99,0.06)] border border-[#2A2119] rounded-xl overflow-hidden">
              <div className="w-10 h-10 rounded-full border border-primary/20 relative shrink-0">
                <Image className="object-cover" alt={currentUser?.user_metadata?.raw_name || 'Membro'} src={currentUser?.user_metadata?.role === 'barbeiro' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBROnOnhXtc-pnvgIhPVQy9GHLQYXvXuhVA_c2NaS_qh_meVth3C4hSdJL4fow8IuMNOGVsiNJkO6tpos7nqWONUK0M98qVXF0DTJ3wWkeVP00kmLD7sWHV8DQLYBZJO3bhDKXp0hegJCHtM8WFuXYWDbrhvxZlGoIFQpvBcuqQshzwD2ELYN5kAdmKJ1mk6teH1w5o2bDEVN3o9VD_IMNILo1EA-a4d7L9mSZmwWKjsvb17Z9X6k07QQ09XulJemy6HCtBuXE7QIc' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEe6N8a7kDVK96OuNzsF8B1KlG92y_ceAS651-BNVdcjzMI5bIoXXe7ElRRl6p3YmMg2rYN_IKrCavgvVQEU-dQPk08YT-eybzYzc_RarN-iLQiWtLmAXK2RQDIRV_t3iOfmc3LSAevFw18xXiuK62dJ4e_fBF5yUSkgUZjIDYIZ6BaM-slmUSSSgXbqZfYCBIfkOuM2pCk2OknJ9EOEtQacPAbTIbiphLp58JgM-N7f0qU6O34Qk-r0as2ARNnlNL_8abA6fBY_U'} fill referrerPolicy="no-referrer" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden text-left">
                  <p className="font-label-md text-sm text-on-surface truncate">{currentUser?.user_metadata?.raw_name || 'Membro Equipe'}</p>
                  <p className="text-[10px] text-on-surface-variant truncate uppercase tracking-widest font-bold">{currentUser?.user_metadata?.role || 'Gerente'}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col h-full bg-background overflow-y-auto custom-scrollbar pb-16">
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 backdrop-blur-xl border-b border-[#2A2119]" style={{ background: 'rgba(15,11,8,0.82)' }}>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarCollapsed((p) => !p)} className="p-2 rounded-full hover:bg-white/5 text-primary transition-colors shrink-0"><Menu className="w-6 h-6" /></button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dashboardTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="font-display-lg text-headline-md font-bold text-on-surface hidden md:block">
                    {({ dashboard: 'Dashboard Administrativo', agenda: 'Agenda', agendamentos: 'Agendamentos', clientes: 'Clientes', barbeiros: 'Equipa de Barbeiros', servicos: 'Serviços', caixa: 'Caixa', controle: 'Controle Financeiro', estoque: 'Estoque', fidelizacao: 'Programa de Fidelização', 'pagina-publica': 'Página Pública' } as Record<string, string>)[dashboardTab] ?? 'Dashboard Administrativo'}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant font-medium hidden md:block">
                    {({ dashboard: 'Aqui está o resumo do seu negócio.', agenda: 'Grelha de horários do dia.', agendamentos: 'Lista completa de agendamentos.', clientes: 'Base de clientes da barbearia.', barbeiros: 'Estado e desempenho da equipa.', servicos: 'Catálogo de serviços e preços.', caixa: 'Gestão do caixa e transações.', controle: 'Metas e controle de receitas.', estoque: 'Produtos e alertas de stock.', fidelizacao: 'Pontos e recompensas dos clientes.' } as Record<string, string>)[dashboardTab] ?? 'Bem-vindo de volta!'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setIsSqlModalOpen(true); triggerToast('Painel Supabase carregado.'); }} className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold uppercase transition-all shrink-0 cursor-pointer hover:scale-[1.02] ${supabaseSync.connected ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-500 border-amber-500/20'}`} title="Status Supabase">
                <span className={`w-2 h-2 rounded-full ${supabaseSync.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="hidden sm:inline">{supabaseSync.connected ? 'Supabase Ativo' : 'Banco Setup'}</span>
              </button>
              <button onClick={() => triggerToast('Calendário sincronizado para hoje.')} className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-on-surface-variant font-label-md hover:text-primary active:scale-95 text-xs font-semibold shrink-0">
                <Calendar className="w-4 h-4 text-primary" /> {formatDatePtBR(TODAY)}
              </button>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => triggerToast('Nenhuma notificação crítica pendente.')} className="p-2 rounded-full glass-card hover:text-primary transition-all active:scale-90"><Bell className="w-4 h-4" /></button>
                <button onClick={handleLogout} className="p-2 rounded-full glass-card hover:text-red-400 transition-all" title="Sair"><LogOut className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </header>

          {/* Content */}
          <AnimatePresence mode="wait">
          <motion.div
            key={dashboardTab}
            initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 md:px-8 pt-6 space-y-6"
          >
            {/* Trial expiry banner */}
            {showTrialBanner && trialDaysLeft !== null && (
              <div className={`p-4 rounded-xl flex items-center justify-between border ${trialDaysLeft <= 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${trialDaysLeft <= 0 ? 'text-rose-400' : 'text-amber-400'}`} />
                  <p className="text-sm font-semibold">
                    {trialDaysLeft <= 0
                      ? 'O seu período de trial expirou. Contacte o suporte para continuar.'
                      : `O seu trial termina em ${trialDaysLeft} dia${trialDaysLeft === 1 ? '' : 's'}. Faça upgrade para continuar sem interrupções.`}
                  </p>
                </div>
                <span className="text-xs font-bold tracking-wider uppercase shrink-0 pl-4 opacity-70">Trial</span>
              </div>
            )}

            {pendingStockAlertsCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" /><p className="text-sm font-semibold">Atenção: {pendingStockAlertsCount} alertas de estoque baixo!</p></div>
                <a href="#estoque-alert" className="text-xs text-primary font-bold hover:underline shrink-0 pl-4">Resolver alertas</a>
              </div>
            )}

            {dashboardTab === 'dashboard' && (
              <>
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Receita do dia', value: `€ ${totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, stroke: 'stroke-primary', path: 'M0,25 Q10,15 20,20 T40,10 T60,18 T80,5 T100,15' },
                    { label: 'Agendamentos hoje', value: String(totalAgendamentosHoje), icon: Calendar, stroke: 'stroke-green-500', path: 'M0,20 Q15,25 30,10 T60,15 T100,5' },
                    { label: 'Clientes ativos', value: String(activeClientsCount), icon: Users, stroke: 'stroke-blue-500', path: 'M0,25 L20,20 L40,22 L60,10 L80,12 L100,5' },
                    { label: 'Ticket médio', value: `€ ${averageTicket.toFixed(2)}`, icon: TrendingUp, stroke: 'stroke-purple-500', path: 'M0,20 Q20,20 40,5 T80,15 T100,10' },
                  ].map(({ label, value, icon: Icon, stroke, path }) => (
                    <div key={label} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 shimmer opacity-10 pointer-events-none" />
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><Icon className="w-5 h-5 text-primary" /></div>
                      </div>
                      <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">{label}</p>
                      <h3 className="text-headline-md font-bold font-display text-on-surface mt-1">{value}</h3>
                      <div className="mt-4 h-12 w-full relative z-10"><svg className={`w-full h-full ${stroke} fill-none stroke-2 chart-glow`} viewBox="0 0 100 30"><path d={path} /></svg></div>
                    </div>
                  ))}
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <div><h4 className="text-headline-sm font-semibold text-on-surface">Faturamento Semanal</h4><p className="text-body-sm text-on-surface-variant">Gráfico de entradas</p></div>
                      <select onChange={(e) => triggerToast(`Filtro: "${e.target.value}"`)} className="bg-surface-container-high border border-white/10 rounded-lg font-label-md text-sm text-on-surface px-4 py-2 focus:ring-1 focus:ring-primary transition-all hover:border-primary/50 cursor-pointer">
                        <option value="semana" className="bg-[#18120D] text-[#F5F1EB]">Esta semana</option>
                        <option value="mes" className="bg-[#18120D] text-[#F5F1EB]">Último mês</option>
                      </select>
                    </div>
                    <div className="h-[280px] w-full relative flex flex-col justify-end">
                      <div className="flex-1 w-full flex items-end gap-2 pb-6 relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                          <defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#C89A63" stopOpacity="0.25" /><stop offset="100%" stopColor="#C89A63" stopOpacity="0.0" /></linearGradient></defs>
                          {weeklyData.length > 0 && (() => {
                            const pts = weeklyData.map((n) => `${n.coordinates.cx},${n.coordinates.cy}`).join(' L ');
                            const linePath = `M ${pts}`;
                            const areaPath = `M ${pts} V200 H0 Z`;
                            return (<>
                              <path d={areaPath} fill="url(#chartGradient)" />
                              <path className="chart-glow stroke-primary stroke-[3px] fill-none" d={linePath} />
                            </>);
                          })()}
                          {weeklyData.map((node, index) => (
                            <g key={index}><circle className="transition-all duration-150 cursor-pointer fill-primary stroke-background stroke-2" cx={node.coordinates.cx} cy={node.coordinates.cy} r={activeChartNode === index ? 7 : 4} onMouseEnter={() => setActiveChartNode(index)} onMouseLeave={() => setActiveChartNode(null)} onClick={() => triggerToast(`Faturamento em ${node.day}: € ${node.revenue.toLocaleString('pt-BR')}`)} /></g>
                          ))}
                        </svg>
                        {activeChartNode !== null && (
                          <div className="absolute bg-surface-container-highest border border-primary/30 p-2.5 rounded-lg shadow-xl text-left pointer-events-none backdrop-blur-md" style={{ left: `${weeklyData[activeChartNode].coordinates.cx / 7.1}%`, top: `${weeklyData[activeChartNode].coordinates.cy - 70}px` }}>
                            <p className="text-[10px] font-bold text-primary tracking-wide uppercase">{weeklyData[activeChartNode].day} (Faturamento)</p>
                            <p className="text-xs font-semibold text-white">€ {weeklyData[activeChartNode].revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-on-surface-variant font-semibold text-xs pt-4 border-t border-white/5">{weeklyData.map((n, idx) => <span key={idx}>{n.day}</span>)}</div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col">
                    <h4 className="text-headline-sm font-semibold text-on-surface mb-8">Serviços mais vendidos</h4>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                      <div className="relative w-44 h-44 mb-8 group cursor-pointer transition-transform duration-500 hover:scale-105">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#2a2a2a" strokeWidth="4" />
                          {topServices[0] && <circle className="transition-all duration-1000" cx="18" cy="18" fill="transparent" r="15.915" stroke="#C89A63" strokeWidth="4" strokeDasharray={`${topServices[0].percent} ${100 - topServices[0].percent}`} strokeDashoffset="0" />}
                          {topServices[1] && <circle className="transition-all duration-1000" cx="18" cy="18" fill="transparent" r="15.915" stroke="#ffb4a8" strokeWidth="4" strokeDasharray={`${topServices[1].percent} ${100 - topServices[1].percent}`} strokeDashoffset={`-${topServices[0]?.percent ?? 0}`} />}
                          {topServices[2] && <circle className="transition-all duration-1000" cx="18" cy="18" fill="transparent" r="15.915" stroke="#bfcdff" strokeWidth="4" strokeDasharray={`${topServices[2].percent} ${100 - topServices[2].percent}`} strokeDashoffset={`-${(topServices[0]?.percent ?? 0) + (topServices[1]?.percent ?? 0)}`} />}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total</p><p className="text-headline-md font-bold text-white leading-none">{totalAtendimentos}</p><p className="text-[9px] text-on-surface-variant">atendimentos</p></div>
                      </div>
                      <div className="w-full space-y-3">
                        {topServices.length === 0 && <p className="text-xs text-on-surface-variant text-center py-4">Sem dados ainda.</p>}
                        {topServices.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                            <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-[#ffb4a8]' : 'bg-[#bfcdff]'}`} /><span className="text-sm font-medium text-on-surface-variant">{item.label}</span></div>
                            <span className="text-on-surface font-semibold text-xs font-mono">{item.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Appointments widget */}
                  <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h4 className="font-display font-medium text-[16px] text-on-surface">Próximos agendamentos</h4>
                      <button onClick={() => handleOpenBooking()} className="text-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-0.5"><Plus className="w-3.5 h-3.5" /> Novo Appt</button>
                    </div>
                    <div className="mb-4">
                      <div className="relative"><Search className="absolute left-3 top-2.5 text-on-surface-variant w-4 h-4" /><input type="text" placeholder="Pesquisar agendamento..." value={dashboardSearchQuery} onChange={(e) => setDashboardSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" /></div>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                      {appointments.filter((a) => a.clientName.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || a.serviceName.toLowerCase().includes(dashboardSearchQuery.toLowerCase())).map((appt) => (
                        <div key={appt.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all flex flex-col gap-2 group">
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-bold text-primary shrink-0 bg-primary/10 px-2 py-1 rounded">{appt.time}</div>
                            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-on-surface truncate">{appt.clientName}</p><p className="text-[10px] text-on-surface-variant">{appt.serviceName}</p></div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${appt.status === 'Concluído' ? 'bg-green-500/15 text-green-400' : appt.status === 'Em andamento' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'}`}>{appt.status}</span>
                            <div className="flex gap-1">
                              {appt.status !== 'Concluído' && <button onClick={() => handleCompleteAppt(appt.id)} className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors" title="Concluir"><Check className="w-3.5 h-3.5" /></button>}
                              <button onClick={() => handleRemoveAppt(appt.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Remover"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {appointments.length === 0 && <p className="text-xs text-on-surface-variant text-center py-8">Nenhum agendamento ativo.</p>}
                    </div>
                  </div>

                  {/* Barbers widget */}
                  <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h4 className="font-display font-medium text-[16px] text-on-surface">Barbeiros online</h4>
                      <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />Ativos</span>
                    </div>
                    <div className="space-y-3 overflow-y-auto">
                      {barbers.map((b) => (
                        <div key={b.id} onClick={() => handleToggleBarber(b.id)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-white/5 hover:border-primary/20 bg-white/[0.01]">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full border border-primary/20 relative"><Image className={`object-cover ${b.status === 'Ausente' ? 'grayscale opacity-50' : ''}`} alt={b.name} src={b.avatarUrl} fill referrerPolicy="no-referrer" /></div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${b.status === 'Livre' ? 'bg-green-500' : b.status === 'Atendendo' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-left"><p className="text-xs font-semibold text-on-surface truncate">{b.name}</p><p className="text-[10px] text-on-surface-variant font-medium">{b.status} • {b.specialty}</p></div>
                          <div className="text-[9px] font-bold text-on-surface-variant font-mono px-2 py-1 bg-white/5 rounded shrink-0">{b.room}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock widget */}
                  <div id="estoque-alert" className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h4 className="font-display font-medium text-[16px] text-on-surface">Alertas de estoque</h4>
                      <span className="p-1 bg-error-container/30 rounded text-error text-[10px] font-bold">{pendingStockAlertsCount} Alertas</span>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto">
                      {stockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group p-2 rounded-xl bg-white/[0.01] hover:bg-white/5 border border-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'Estoque crítico' ? 'bg-error-container/30 text-error' : 'bg-white/5 text-primary'}`}><Package className="w-5 h-5" /></div>
                            <div className="text-left"><p className="text-xs font-semibold text-on-surface">{item.name}</p><p className={`text-[10px] font-semibold ${item.status === 'Estoque crítico' ? 'text-red-400 uppercase tracking-wider' : 'text-amber-500'}`}>{item.status} ({item.quantity} un)</p></div>
                          </div>
                          <button onClick={() => setSelectedRestockItem(item)} className="p-1.5 hover:bg-primary/20 text-primary hover:text-white rounded-lg transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-primary" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Finance widget */}
                  <div className="xl:col-span-1 glass-card p-5 rounded-2xl flex flex-col bg-gradient-to-br from-white/5 to-transparent h-full">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h4 className="font-display font-medium text-[16px] text-on-surface">Visão geral do mês</h4>
                      <button onClick={() => setIsFinancialModalOpen(true)} className="p-1 bg-primary/20 text-primary rounded hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-6 text-left">
                      <div className="group cursor-default">
                        <div className="flex justify-between items-center mb-1"><span className="text-on-surface-variant font-medium text-[10px] uppercase tracking-wider">Faturamento</span></div>
                        <p className="text-xl font-bold font-display text-on-surface group-hover:text-primary transition-colors">€ {finances.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-primary h-full rounded-full shadow-[0_0_12px_#C89A63] transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (finances.faturamento / 60000) * 100)}%` }} /></div>
                      </div>
                      <div className="group cursor-default">
                        <div className="flex justify-between items-center mb-1"><span className="text-on-surface-variant font-medium text-[10px] uppercase tracking-wider">Despesas</span></div>
                        <p className="text-xl font-bold font-display text-on-surface group-hover:text-red-400 transition-colors">€ {finances.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-red-500 h-full rounded-full shadow-[0_0_12px_#ef4444] transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (finances.despesas / 30000) * 100)}%` }} /></div>
                      </div>
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center"><span className="text-on-surface-variant font-semibold text-[10px] uppercase tracking-wider">Lucro Líquido</span><p className="text-xl font-bold text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] font-mono">€ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {dashboardTab === 'agenda' && <AgendaView selectedAgendaDate={selectedAgendaDate} setSelectedAgendaDate={setSelectedAgendaDate} barbers={barbers} appointments={appointments} handleCompleteAppt={handleCompleteAppt} handleUpdateAppointmentStatus={handleUpdateAppointmentStatus} setBookingFormData={setBookingFormData} setIsSchedulingsOpen={setIsSchedulingsOpen} triggerToast={triggerToast} setAuditLogs={setAuditLogs} />}
            {dashboardTab === 'agendamentos' && <AgendamentosView appointments={appointments} clientSearchFilter={clientSearchFilter} setClientSearchFilter={setClientSearchFilter} activeStatusFilter={activeStatusFilter} setActiveStatusFilter={setActiveStatusFilter} handleCompleteAppt={handleCompleteAppt} handleUpdateAppointmentStatus={handleUpdateAppointmentStatus} handleRemoveAppt={handleRemoveAppt} barbers={barbers} handleOpenBooking={handleOpenBooking} triggerToast={triggerToast} setAuditLogs={setAuditLogs} />}
            {dashboardTab === 'clientes' && <ClientesView clients={clients} setClients={setClients} clientSearchFilter={clientSearchFilter} setClientSearchFilter={setClientSearchFilter} isClientFormExpanded={isClientFormExpanded} setIsClientFormExpanded={setIsClientFormExpanded} clientFormState={clientFormState} setClientFormState={setClientFormState} setActiveClientsCount={setActiveClientsCount} setAuditLogs={setAuditLogs} triggerToast={triggerToast} averageTicket={averageTicket} />}
            {dashboardTab === 'barbeiros' && <BarbeirosView barbers={barbers} setBarbers={setBarbers} appointments={appointments} services={services} setServices={setServices} isBarberFormExpanded={isBarberFormExpanded} setIsBarberFormExpanded={setIsBarberFormExpanded} newBarberForm={newBarberForm} setNewBarberForm={setNewBarberForm} barberCommission={barberCommission} setBarberCommission={setBarberCommission} handleToggleBarber={handleToggleBarber} setAuditLogs={setAuditLogs} triggerToast={triggerToast} />}
            {dashboardTab === 'servicos' && <ServicosView services={services} setServices={setServices} barbers={barbers} isServiceFormExpanded={isServiceFormExpanded} setIsServiceFormExpanded={setIsServiceFormExpanded} newServiceForm={newServiceForm} setNewServiceForm={setNewServiceForm} setAuditLogs={setAuditLogs} triggerToast={triggerToast} />}
            {dashboardTab === 'caixa' && <CaixaView lucroLiquido={lucroLiquido} finances={finances} setFinances={setFinances} cashRegisterStatus={cashRegisterStatus} setCashRegisterStatus={setCashRegisterStatus} cashTransactions={cashTransactions} setCashTransactions={setCashTransactions} transactionSearchQuery={transactionSearchQuery} setTransactionSearchQuery={setTransactionSearchQuery} transactionTypeFilter={transactionTypeFilter} setTransactionTypeFilter={setTransactionTypeFilter} setIsFinancialModalOpen={setIsFinancialModalOpen} setAuditLogs={setAuditLogs} triggerToast={triggerToast} />}
            {dashboardTab === 'controle' && <ControleView dailyTarget={dailyTarget} setDailyTarget={setDailyTarget} setAppointments={setAppointments} setCashTransactions={setCashTransactions} setFinances={setFinances} auditLogs={auditLogs} setAuditLogs={setAuditLogs} barbers={barbers} triggerToast={triggerToast} />}
            {dashboardTab === 'estoque' && <EstoqueView stockItems={stockItems} setStockItems={setStockItems} inventorySearchQuery={inventorySearchQuery} setInventorySearchQuery={setInventorySearchQuery} isProductFormExpanded={isProductFormExpanded} setIsProductFormExpanded={setIsProductFormExpanded} newProductForm={newProductForm} setNewProductForm={setNewProductForm} setSelectedRestockItem={setSelectedRestockItem} setAuditLogs={setAuditLogs} triggerToast={triggerToast} />}
            {dashboardTab === 'fidelizacao' && <FidelizacaoView clients={clients} setClients={setClients} loyaltyRewardSelection={loyaltyRewardSelection} setLoyaltyRewardSelection={setLoyaltyRewardSelection} setAuditLogs={setAuditLogs} triggerToast={triggerToast} />}
            {dashboardTab === 'suporte' && (
              <SuporteView
                shopId={shopPage?.company_id || currentUser?.id || ''}
                shopName={shopStatus?.shop_name || 'Barbearia'}
                userEmail={currentUser?.email}
                triggerToast={triggerToast}
              />
            )}

            {/* ====== PÁGINA PÚBLICA ====== */}
            {dashboardTab === 'pagina-publica' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                {/* Public URL banner */}
                {shopPage?.slug && (
                  <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-1">Sua página pública</p>
                      <p className="text-sm font-mono text-primary truncate">/{shopPage.slug}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${shopPage.slug}`); triggerToast('URL copiada!'); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-on-surface-variant cursor-pointer transition-all">
                        <Copy className="w-3.5 h-3.5" /> Copiar URL
                      </button>
                      <a href={`/${shopPage.slug}`} target="_blank" rel="noopener"
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-bold text-primary cursor-pointer transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Ver página
                      </a>
                    </div>
                  </div>
                )}
                {!shopPage?.slug && (
                  <div className="glass-card p-4 rounded-2xl border border-amber-500/20 text-amber-400 text-sm flex items-center gap-3">
                    <Globe className="w-5 h-5 shrink-0" />
                    <span>Página pública ainda não criada. Será gerada automaticamente após aprovação pelo Super Admin.</span>
                  </div>
                )}

                {/* Slug / URL customization */}
                <section className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-headline-sm font-semibold text-on-surface flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> URL Personalizada</h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1.5">Slug (apenas letras, números e hífens)</label>
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-primary/50 transition-colors">
                        <span className="px-3 text-xs text-on-surface-variant font-mono shrink-0 border-r border-white/10 py-3">/</span>
                        <input type="text" value={slugInput} onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="nome-da-barbearia"
                          className="flex-1 bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none" />
                      </div>
                    </div>
                    <button
                      disabled={!slugInput || !shopPage?.company_id || shopPageSaving}
                      onClick={async () => {
                        if (!shopPage?.company_id) return;
                        setShopPageSaving(true);
                        const ok = await updateShopSlug(shopPage.company_id, slugInput);
                        if (ok) { setShopPage(p => p ? { ...p, slug: slugInput } : p); triggerToast('URL atualizada!'); }
                        else triggerToast('Slug já em uso. Escolha outro.');
                        setShopPageSaving(false);
                      }}
                      className="self-end px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg text-xs font-black uppercase cursor-pointer transition-all disabled:opacity-40 shrink-0">
                      Aplicar
                    </button>
                  </div>
                </section>

                {/* Page config form */}
                <section className="glass-card p-6 rounded-2xl space-y-5">
                  <h3 className="text-headline-sm font-semibold text-on-surface">Informações da Página</h3>
                  {([
                    { key: 'display_name', label: 'Nome Público', type: 'text', placeholder: 'Barber King' },
                    { key: 'description', label: 'Descrição', type: 'text', placeholder: 'A melhor barbearia da cidade...' },
                    { key: 'address', label: 'Morada', type: 'text', placeholder: 'Rua das Flores 123, Lisboa' },
                    { key: 'phone', label: 'Telefone', type: 'tel', placeholder: '+351 912 345 678' },
                    { key: 'whatsapp', label: 'WhatsApp', type: 'tel', placeholder: '+351 912 345 678' },
                    { key: 'contact_email', label: 'Email de Contacto', type: 'email', placeholder: 'geral@barbearia.com' },
                    { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@barberbking' },
                    { key: 'facebook', label: 'Facebook', type: 'text', placeholder: 'barber.king' },
                    { key: 'google_maps_url', label: 'Link Google Maps', type: 'url', placeholder: 'https://maps.google.com/...' },
                    { key: 'map_embed_url', label: 'Embed Google Maps (iframe src)', type: 'url', placeholder: 'https://www.google.com/maps/embed?pb=...' },
                    { key: 'primary_color', label: 'Cor Principal', type: 'color', placeholder: '#f59e0b' },
                  ] as const).map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1.5">{label}</label>
                      <input type={type} value={(shopPageForm as any)[key] || ''} onChange={e => setShopPageForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={`${type === 'color' ? 'h-10 w-24 p-1 cursor-pointer' : 'w-full px-4 py-3'} bg-white/5 border border-white/10 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors`} />
                    </div>
                  ))}

                  {/* Logo upload */}
                  <div>
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1.5">Logótipo</label>
                    <input ref={logoUploadRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setIsUploadingLogo(true);
                        const path = `shop_logo_${Date.now()}.${file.name.split('.').pop()}`;
                        const url = await uploadImage('shop-logos', file, path);
                        setIsUploadingLogo(false);
                        if (url) { setShopPageForm(p => ({ ...p, logo_url: url })); triggerToast('Logótipo carregado!'); }
                        else triggerToast('Erro no upload. Tente novamente.');
                        e.target.value = '';
                      }} />
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      {shopPageForm.logo_url ? (
                        <img src={shopPageForm.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-on-surface truncate">{shopPageForm.logo_url ? 'Logótipo carregado' : 'Nenhuma imagem'}</p>
                        <p className="text-[10px] text-on-surface-variant">PNG, SVG, JPG · máx. 2MB</p>
                      </div>
                      <button type="button" disabled={isUploadingLogo} onClick={() => logoUploadRef.current?.click()}
                        className="text-xs font-bold text-primary hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0">
                        {isUploadingLogo ? 'A carregar...' : shopPageForm.logo_url ? 'Alterar' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  {/* Cover photo upload */}
                  <div>
                    <label className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1.5">Foto de Capa</label>
                    <input ref={coverUploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setIsUploadingCover(true);
                        const path = `shop_cover_${Date.now()}.${file.name.split('.').pop()}`;
                        const url = await uploadImage('shop-logos', file, path);
                        setIsUploadingCover(false);
                        if (url) { setShopPageForm(p => ({ ...p, cover_url: url })); triggerToast('Foto de capa carregada!'); }
                        else triggerToast('Erro no upload. Tente novamente.');
                        e.target.value = '';
                      }} />
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      {shopPageForm.cover_url ? (
                        <img src={shopPageForm.cover_url} alt="Capa" className="w-16 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant shrink-0">
                          <Palette className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-on-surface truncate">{shopPageForm.cover_url ? 'Foto de capa carregada' : 'Nenhuma imagem'}</p>
                        <p className="text-[10px] text-on-surface-variant">PNG, JPG, WebP · máx. 2MB</p>
                      </div>
                      <button type="button" disabled={isUploadingCover} onClick={() => coverUploadRef.current?.click()}
                        className="text-xs font-bold text-primary hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0">
                        {isUploadingCover ? 'A carregar...' : shopPageForm.cover_url ? 'Alterar' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" id="pub-published" checked={shopPageForm.is_published !== false}
                      onChange={e => setShopPageForm(p => ({ ...p, is_published: e.target.checked }))}
                      className="accent-amber-500 w-4 h-4 cursor-pointer" />
                    <label htmlFor="pub-published" className="text-sm text-on-surface cursor-pointer">Página publicada (visível ao público)</label>
                  </div>

                  <button
                    disabled={shopPageSaving || !shopPage?.company_id}
                    onClick={async () => {
                      if (!shopPage?.company_id) return;
                      setShopPageSaving(true);
                      const name = shopPageForm.display_name || shopPage.display_name || 'Barbearia';
                      const desc = shopPageForm.description || shopPage.description
                        || `Agende o seu corte em ${name}. Escolha o serviço, barbeiro e horário que preferir — rápido e sem complicações.`;
                      const toSave = {
                        ...shopPageForm,
                        company_id: shopPage.company_id,
                        slug: shopPage.slug,
                        description: desc,
                        meta_title: `${name} — Agendamento Online`,
                        meta_description: desc.slice(0, 155),
                        cancellation_policy: shopPageForm.cancellation_policy
                          || 'Cancelamentos devem ser feitos com pelo menos 2 horas de antecedência.',
                      };
                      const ok = await saveShopPage(toSave as any);
                      if (ok) { setShopPage(p => p ? { ...p, ...toSave } : p); triggerToast('Página pública atualizada!'); }
                      else { triggerToast('Erro ao guardar. Tente novamente.'); }
                      setShopPageSaving(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-black rounded-xl text-sm uppercase tracking-wide cursor-pointer transition-all hover:brightness-110 disabled:opacity-50 shadow-lg">
                    {shopPageSaving ? <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                    Guardar Alterações
                  </button>
                </section>
              </div>
            )}
          </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isSchedulingsOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSchedulingsOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-lg bg-surface-container-low border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl z-10 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2"><Scissors className="w-5 h-5 text-primary" /><h3 className="font-display-lg text-headline-sm font-bold text-on-surface">Agendar Horário Premium</h3></div>
                <button onClick={() => setIsSchedulingsOpen(false)} className="p-1 px-2 hover:bg-white/5 rounded-md text-on-surface-variant font-mono">X</button>
              </div>
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-left">
                <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Nome Completo</label><input type="text" required placeholder="Ex: Carlos Silva" value={bookingFormData.name} onChange={(e) => setBookingFormData((p) => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Serviço Premium</label><select value={bookingFormData.serviceId} onChange={(e) => setBookingFormData((p) => ({ ...p, serviceId: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary cursor-pointer">{services.map((srv) => <option key={srv.id} value={srv.id} className="bg-[#18120D] text-[#F5F1EB]">{srv.name} (€ {srv.price})</option>)}</select></div>
                  <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Barbeiro</label><select value={bookingFormData.barberId} onChange={(e) => setBookingFormData((p) => ({ ...p, barberId: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary cursor-pointer">{barbers.map((b) => <option key={b.id} value={b.id} className="bg-[#18120D] text-[#F5F1EB]">{b.name} ({b.specialty})</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Data</label><input type="date" required value={bookingFormData.date} onChange={(e) => setBookingFormData((p) => ({ ...p, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                  <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Horário</label><input type="text" required placeholder="Ex: 14:30" value={bookingFormData.time} onChange={(e) => setBookingFormData((p) => ({ ...p, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div><p className="text-xs text-on-surface-variant font-medium">Preço Total Estimado</p><p className="text-lg font-bold text-primary font-mono">€ {(services.find((s) => s.id === bookingFormData.serviceId)?.price || 0).toFixed(2)}</p></div>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Sincronizado</div>
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm tracking-wide cursor-pointer">Confirmar Agendamento Premium</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financial Modal */}
      <AnimatePresence>
        {isFinancialModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFinancialModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div className="relative w-full max-w-md bg-surface-container-low border border-white/10 p-6 rounded-2xl shadow-2xl z-10 text-left" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5"><h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Lançamento Financeiro</h3><button onClick={() => setIsFinancialModalOpen(false)} className="p-1 px-2 hover:bg-white/5 text-xs text-on-surface-variant font-mono">X</button></div>
              <form onSubmit={handleFinancialSubmit} className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Tipo</label><select value={financialForm.type} onChange={(e) => setFinancialForm((p) => ({ ...p, type: e.target.value as any }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-3 text-sm text-on-surface cursor-pointer"><option value="faturamento" className="bg-[#18120D] text-[#F5F1EB]">Entrada / Faturamento (+)</option><option value="despesas" className="bg-[#18120D] text-[#F5F1EB]">Saída / Despesa (-)</option></select></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Valor (€)</label><input type="number" required step="0.01" placeholder="Ex: 1500.00" value={financialForm.amount} onChange={(e) => setFinancialForm((p) => ({ ...p, amount: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-primary uppercase tracking-wide">Descrição</label><input type="text" placeholder="Ex: Venda de Shampoos" value={financialForm.description} onChange={(e) => setFinancialForm((p) => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                <button type="submit" className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all text-sm cursor-pointer">Registrar Lançamento</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Dialog */}
      <AnimatePresence>
        {selectedRestockItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRestockItem(null)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div className="relative w-full max-w-sm bg-surface-container-low border border-white/10 p-6 rounded-2xl shadow-2xl z-10 text-center space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center text-primary"><Package className="w-6 h-6" /></div>
              <div><h3 className="font-display-lg text-lg font-bold text-on-surface">Reposição de Material</h3><p className="text-sm text-on-surface-variant mt-2">Adicionar +10 unidades ao produto <span className="text-primary font-bold">{selectedRestockItem.name}</span>?</p></div>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={() => setSelectedRestockItem(null)} className="px-4 py-2 border border-white/10 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-white transition-opacity">Cancelar</button>
                <button onClick={() => handleRestock(selectedRestockItem)} className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 shadow-lg">Adicionar Estoque</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supabase SQL Modal */}
      <AnimatePresence>
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSqlModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div className="relative w-full max-w-2xl bg-[#111110] border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl z-20 space-y-6 max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
              <div className="flex justify-between items-start">
                <div><h3 className="font-display-lg text-xl font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Supabase Cloud Database</h3><p className="text-stone-400 text-xs mt-1">Conectado ao projeto <code className="text-amber-500 font-mono">hxpjgdiimpudjttbhhxh</code>.</p></div>
                <button onClick={() => setIsSqlModalOpen(false)} className="p-1 px-2.5 bg-neutral-900 border border-white/5 text-stone-400 hover:text-white rounded-lg text-xs">Fechar</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                {Object.entries({ Clientes: 'clients', Barbeiros: 'barbers', Serviços: 'services', Agendamentos: 'appointments', Transações: 'transactions', Estoque: 'stock_items' }).map(([label, dbName]) => (
                  <div key={dbName} className="flex items-center gap-2.5 text-xs"><div className={`w-2 h-2 rounded-full ${supabaseSync.connected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-600'}`} /><div><span className="block text-stone-300 font-bold">{label}</span><span className="text-[10px] text-stone-500 font-mono">{supabaseSync.connected ? 'Sincronizado' : 'Aguardando'}</span></div></div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-stone-200"><span>Script de Migração SQL</span><button onClick={() => { navigator.clipboard.writeText(SUPABASE_SETUP_SQL); triggerToast('Script copiado!'); }} className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/15 cursor-pointer font-semibold uppercase tracking-wider transition-all">Copiar Script</button></div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 relative overflow-hidden"><pre className="text-[11px] font-mono text-stone-400 max-h-48 overflow-y-auto custom-scrollbar select-text">{SUPABASE_SETUP_SQL}</pre></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
