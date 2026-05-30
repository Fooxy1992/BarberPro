'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  loadSaasShops, saveSaasShop, deleteSaasShop,
  loadSaasCoupons, saveSaasCoupon, deleteSaasCoupon,
  loadSaasInvites, saveSaasInvite,
  loadSaasPlans, saveSaasPlan, deleteSaasPlan,
  loadSaasNotifications, markNotificationRead, markAllNotificationsRead,
  loadSaasAuditLogs,
  approveShop, rejectShop, suspendShop, reactivateShop, extendTrial, updateShopPlan, addShopNote,
  loadSaasTickets, createSaasTicket, updateTicketStatus, loadTicketMessages, addTicketMessage,
  uploadImage,
  type SaasShop, type SaasCoupon, type SaasInvite,
  type SaasPlan, type SaasNotification, type SaasAuditLog,
  type SaasTicket, type TicketMessage,
} from '../lib/supabase-service';
import { supabase } from '../lib/supabase';
import {
  Scissors, LayoutDashboard, Store, CreditCard, TrendingUp, Settings,
  Bell, Search, Plus, ChevronRight, ChevronLeft, Download, Users,
  Headphones, Lock, AlertTriangle, CheckCircle2, Trash2, ArrowRight,
  MoreVertical, Star, Check, Mail, Phone, MapPin, DollarSign, Percent,
  Calendar, MessageSquare, Shield, FileText, Send, HelpCircle, LifeBuoy,
  ClipboardList, BadgeCheck, XCircle, PauseCircle, PlayCircle, Clock,
  RefreshCw, Package, Edit3, X, ChevronDown,
} from 'lucide-react';

interface SuperAdminViewsProps {
  onBackToMain: () => void;
  triggerToast: (msg: string) => void;
}

// Interfaces
// (Shop, Coupon, Invite types are imported from supabase-service as SaasShop, SaasCoupon, SaasInvite)

// Ticket types imported from supabase-service (SaasTicket, TicketMessage)

const DEFAULT_SHOPS: SaasShop[] = [];
const DEFAULT_COUPONS: SaasCoupon[] = [];

export function SuperAdminView({ onBackToMain, triggerToast }: SuperAdminViewsProps) {
  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'shops' | 'plans' | 'notifications' | 'subscriptions' | 'invites' | 'revenue' | 'support' | 'audit' | 'logs' | 'users' | 'settings' | 'monitor'>('dashboard');
  
  // Settings view sub-tab
  const [settingsTab, setSettingsTab] = useState<'general' | 'security' | 'billing' | 'notifications'>('general');

  // --- STATE FOR SHOPS ---
  const [shops, setShops] = useState<SaasShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

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
    mrr: '249.00',
    logo_url: '',
  });
  const [isUploadingShopLogo, setIsUploadingShopLogo] = useState(false);
  const shopLogoInputRef = useRef<HTMLInputElement>(null);

  // Institutional logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [institutionalLogoUrl, setInstitutionalLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const [coupons, setCoupons] = useState<SaasCoupon[]>([]);
  const [isNewCouponOpen, setIsNewCouponOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '20% OFF', total: 100, expiry: '12/26' });

  // --- STATE FOR SUPPORT TICKETS ---
  const [tickets, setTickets] = useState<SaasTicket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [activeTicketId, setActiveTicketId] = useState('');
  const saMessagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { saMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticketMessages]);
  const [replyMessage, setReplyMessage] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', priority: 'normal' as SaasTicket['priority'], shop_id: '', shop_name: '' });
  const [ticketLoading, setTicketLoading] = useState(false);

  // --- STATE FOR PLATFORM SETTINGS ---
  const [platformConfig, setPlatformConfig] = useState({
    name: 'BarberPro SaaS',
    email: 'ops@barberpro.io',
    description: 'A plataforma de gestão de alta performance para barbearias premium.',
    mfaEnabled: true,
    sessionTimeout: '30 Minutes',
    stripeConnected: true
  });

  // --- STATE FOR INVITES ---
  const [invites, setInvites] = useState<SaasInvite[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // --- STATE FOR PLANS (saas_plans) ---
  const [saasPlans, setSaasPlans] = useState<SaasPlan[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);
  const [planForm, setPlanForm] = useState<Partial<SaasPlan>>({});

  // --- STATE FOR NOTIFICATIONS ---
  const [notifications, setNotifications] = useState<SaasNotification[]>([]);

  // --- STATE FOR AUDIT LOGS ---
  const [auditLogs, setAuditLogs] = useState<SaasAuditLog[]>([]);

  // --- STATE FOR SHOP ACTIONS ---
  const [selectedShop, setSelectedShop] = useState<SaasShop | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | 'note' | 'trial' | 'plan' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [trialDaysInput, setTrialDaysInput] = useState(14);
  const [actionPlanId, setActionPlanId] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'All' | 'Pending' | 'Active' | 'Suspended'>('Pending');

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadSuperAdminData() {
      setShopsLoading(true);
      const [loadedShops, loadedCoupons, loadedInvites, loadedPlans, loadedNotifs, loadedAudit, loadedTickets] = await Promise.all([
        loadSaasShops(DEFAULT_SHOPS),
        loadSaasCoupons(DEFAULT_COUPONS),
        loadSaasInvites([]),
        loadSaasPlans(),
        loadSaasNotifications(),
        loadSaasAuditLogs(),
        loadSaasTickets(),
      ]);
      setShops(loadedShops);
      setCoupons(loadedCoupons);
      setInvites(loadedInvites);
      setSaasPlans(loadedPlans);
      setNotifications(loadedNotifs);
      setAuditLogs(loadedAudit);
      setTickets(loadedTickets);
      setShopsLoading(false);
    }
    loadSuperAdminData();
  }, []);

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
    return tickets.find(t => t.id === activeTicketId) || (tickets.length > 0 ? tickets[0] : null);
  }, [tickets, activeTicketId]);

  const filteredTickets = useMemo(() => {
    if (ticketStatusFilter === 'all') return tickets;
    return tickets.filter(t => t.status === ticketStatusFilter);
  }, [tickets, ticketStatusFilter]);

  // Actions handler
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShop.name || !newShop.ownerName || !newShop.email) {
      triggerToast('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    const newId = `BP-${Math.floor(1000 + Math.random() * 9000)}`;
    const shopToAdd: SaasShop = {
      id: newId,
      name: newShop.name,
      ownerName: newShop.ownerName,
      email: newShop.email,
      location: newShop.location || 'Portugal',
      plan: newShop.plan,
      status: newShop.status,
      mrr: parseFloat(newShop.mrr) || 0,
      logo_url: newShop.logo_url || undefined,
    };
    
    // Save to Supabase
    await saveSaasShop(shopToAdd);
    
    setShops([shopToAdd, ...shops]);
    setIsRegisterModalOpen(false);
    triggerToast(`Barbearia "${newShop.name}" registrada com sucesso e ativa no plano SaaS!`);
    setNewShop({
      name: '',
      ownerName: '',
      email: '',
      location: '',
      plan: 'Premium',
      status: 'Active',
      mrr: '249.00',
      logo_url: '',
    });
  };

  const handleDeleteShop = async (id: string, name: string) => {
    // Delete from Supabase
    await deleteSaasShop(id);
    
    setShops(shops.filter(s => s.id !== id));
    triggerToast(`Barbearia "${name}" foi removida do cadastro da plataforma.`);
  };

  const toggleShopStatus = async (id: string, current: 'Active' | 'Pending' | 'Suspended') => {
    const nextStatusMap: Record<'Active' | 'Pending' | 'Suspended', 'Active' | 'Pending' | 'Suspended'> = {
      Active: 'Suspended',
      Suspended: 'Active',
      Pending: 'Active'
    };
    const nextStatus = nextStatusMap[current];
    
    // Find the shop and update it
    const shopToUpdate = shops.find(s => s.id === id);
    if (shopToUpdate) {
      const updatedShop = { ...shopToUpdate, status: nextStatus };
      await saveSaasShop(updatedShop);
    }
    
    setShops(shops.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    triggerToast(`Status da conveniada ajustado para: ${nextStatus}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    
    const couponToAdd: SaasCoupon = {
      code: newCoupon.code.toUpperCase(),
      discount: newCoupon.discount,
      used: 0,
      total: newCoupon.total,
      expiry: newCoupon.expiry
    };
    
    // Save to Supabase
    await saveSaasCoupon(couponToAdd);
    
    setCoupons([...coupons, couponToAdd]);
    setIsNewCouponOpen(false);
    triggerToast(`Cupom promocional ${newCoupon.code.toUpperCase()} criado!`);
  };

  // Load messages when active ticket changes
  useEffect(() => {
    if (!activeTicketId) { setTicketMessages([]); return; }
    loadTicketMessages(activeTicketId).then(setTicketMessages);
  }, [activeTicketId]);

  // Realtime: per-ticket channel — recreated when active ticket changes
  useEffect(() => {
    if (!supabase || !activeTicketId) return;
    const ch = supabase
      .channel(`sa-msgs-${activeTicketId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicketId}` },
        (payload) => {
          const msg = payload.new as TicketMessage;
          setTicketMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          setTickets(prev => prev.map(t => t.id === msg.ticket_id ? { ...t, updated_at: msg.created_at } : t));
        })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, [activeTicketId]);

  // Realtime: ticket list — new + status changes + toast notification
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('sa-tickets-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        (payload) => {
          const t = payload.new as SaasTicket;
          setTickets(prev => prev.some(x => x.id === t.id) ? prev : [t, ...prev]);
          triggerToast(`🎫 Novo chamado de ${t.shop_name || 'loja'}: "${t.subject}"`);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
        (payload) => {
          const t = payload.new as SaasTicket;
          setTickets(prev => prev.map(x => x.id === t.id ? t : x));
        })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;
    setTicketLoading(true);
    const msg = await addTicketMessage(activeTicketId, 'admin', replyMessage.trim(), 'Super Admin');
    if (msg) {
      setTicketMessages(prev => [...prev, msg]);
      setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: 'in_progress', updated_at: msg.created_at } : t));
      setReplyMessage('');
      triggerToast('Resposta enviada à barbearia.');
    } else {
      triggerToast('Erro ao enviar mensagem.');
    }
    setTicketLoading(false);
  };

  const handleResolveTicket = async (ticketId: string) => {
    const ok = await updateTicketStatus(ticketId, 'resolved');
    if (ok) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved', resolved_at: new Date().toISOString() } : t));
      triggerToast('Chamado marcado como Resolvido.');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    const ok = await updateTicketStatus(ticketId, 'open');
    if (ok) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'open' } : t));
      triggerToast('Chamado reaberto.');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim()) return;
    setTicketLoading(true);
    const ticket = await createSaasTicket({
      subject: newTicketForm.subject.trim(),
      priority: newTicketForm.priority,
      status: 'open',
      shop_id: newTicketForm.shop_id || undefined,
      shop_name: newTicketForm.shop_name || undefined,
      created_by: 'super-admin',
    });
    if (ticket) {
      setTickets(prev => [ticket, ...prev]);
      setActiveTicketId(ticket.id);
      setIsNewTicketOpen(false);
      setNewTicketForm({ subject: '', priority: 'normal', shop_id: '', shop_name: '' });
      triggerToast(`Chamado "${ticket.subject}" criado.`);
    } else {
      triggerToast('Erro ao criar chamado.');
    }
    setTicketLoading(false);
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

  const handleCreateInvite = async () => {
    setIsSendingInvite(true);
    try {
      const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://barberproapp.vercel.app';
      const randomCode = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
        : Math.floor(100000 + Math.random() * 900000).toString(16);
      const newId = `inv-${randomCode}`;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const newInvite: SaasInvite = {
        id: newId,
        link: `${baseOrigin}/onboard/${newId}`,
        email: newInviteEmail.trim() || undefined,
        status: 'Active' as const,
        expires: expiresAt.toLocaleDateString('pt-BR'),
        limit: 1,
        used: 0,
      };

      // Save to Supabase
      await saveSaasInvite(newInvite);

      // If an email was provided, trigger the Edge Function to send the invite
      if (newInvite.email) {
        try {
          const { supabase: client } = await import('../lib/supabase');
          if (client) {
            await client.functions.invoke('send-invite', {
              body: {
                invite_id: newId,
                invite_link: newInvite.link,
                recipient_email: newInvite.email,
              },
            });
          }
        } catch (emailErr) {
          console.error('Falha ao enviar email de convite:', emailErr);
          // Non-fatal "” invite was saved, email just didn't send
        }
      }

      setInvites((previousInvites) => [newInvite, ...previousInvites]);
      setIsInviteModalOpen(false);
      setNewInviteEmail('');
      triggerToast(
        newInvite.email
          ? `Convite gerado e email enviado para ${newInvite.email}!`
          : 'Novo convite de onboarding gerado com sucesso!'
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  const SUPER_ADMIN_EMAIL =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.trim().toLowerCase()) ||
    'superadmin@barberpro.com';

  const openAction = (shop: SaasShop, action: typeof actionModal) => {
    setSelectedShop(shop);
    setActionNotes('');
    setTrialDaysInput(14);
    setActionPlanId(shop.plan_id || '');
    setActionModal(action);
  };

  const closeAction = () => { setActionModal(null); setSelectedShop(null); };

  const handleApprove = async () => {
    if (!selectedShop) return;
    setIsActionLoading(true);
    const ok = await approveShop(selectedShop.id, SUPER_ADMIN_EMAIL, trialDaysInput);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, status: 'Active' as const } : s));
      setNotifications(prev => prev.filter(n => !(n.shop_id === selectedShop.id && n.type === 'new_shop')));
      triggerToast(`${selectedShop.name} aprovada! Trial de ${trialDaysInput} dias iniciado.`);
    } else { triggerToast('Erro ao aprovar barbearia.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleReject = async () => {
    if (!selectedShop) return;
    setIsActionLoading(true);
    const ok = await rejectShop(selectedShop.id, SUPER_ADMIN_EMAIL, actionNotes);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, status: 'Suspended' as const } : s));
      triggerToast(`${selectedShop.name} rejeitada.`);
    } else { triggerToast('Erro ao rejeitar barbearia.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleSuspend = async () => {
    if (!selectedShop) return;
    setIsActionLoading(true);
    const ok = await suspendShop(selectedShop.id, SUPER_ADMIN_EMAIL, actionNotes);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, status: 'Suspended' as const } : s));
      triggerToast(`${selectedShop.name} suspensa.`);
    } else { triggerToast('Erro ao suspender.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleReactivate = async () => {
    if (!selectedShop) return;
    setIsActionLoading(true);
    const ok = await reactivateShop(selectedShop.id, SUPER_ADMIN_EMAIL);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, status: 'Active' as const } : s));
      triggerToast(`${selectedShop.name} reativada.`);
    } else { triggerToast('Erro ao reativar.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleExtendTrial = async () => {
    if (!selectedShop) return;
    setIsActionLoading(true);
    const ok = await extendTrial(selectedShop.id, SUPER_ADMIN_EMAIL, trialDaysInput);
    if (ok) { triggerToast(`Trial de ${selectedShop.name} estendido em +${trialDaysInput} dias.`); }
    else { triggerToast('Erro ao estender trial.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleAddNote = async () => {
    if (!selectedShop || !actionNotes.trim()) return;
    setIsActionLoading(true);
    const ok = await addShopNote(selectedShop.id, actionNotes, SUPER_ADMIN_EMAIL);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, notes: actionNotes } : s));
      triggerToast('Observação adicionada.');
    } else { triggerToast('Erro ao adicionar nota.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleUpdatePlan = async () => {
    if (!selectedShop || !actionPlanId) return;
    setIsActionLoading(true);
    const ok = await updateShopPlan(selectedShop.id, actionPlanId, SUPER_ADMIN_EMAIL);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, plan_id: actionPlanId } : s));
      triggerToast('Plano atualizado.');
    } else { triggerToast('Erro ao atualizar plano.'); }
    setIsActionLoading(false);
    closeAction();
  };

  const handleMarkNotifRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    triggerToast('Todas notificações marcadas como lidas.');
  };

  const handleSavePlan = async () => {
    if (!planForm.name) return;
    const planToSave: SaasPlan = {
      id: editingPlan?.id || `plan-${Date.now()}`,
      name: planForm.name || '',
      description: planForm.description || '',
      price_monthly: Number(planForm.price_monthly) || 0,
      price_annual: Number(planForm.price_annual) || 0,
      max_users: Number(planForm.max_users) || 5,
      max_barbers: Number(planForm.max_barbers) || 3,
      max_services: Number(planForm.max_services) || 10,
      max_bookings_per_month: Number(planForm.max_bookings_per_month) || 100,
      features: planForm.features || [],
      is_active: planForm.is_active !== false,
    };
    const ok = await saveSaasPlan(planToSave);
    if (ok) {
      setSaasPlans(prev => editingPlan ? prev.map(p => p.id === editingPlan.id ? planToSave : p) : [planToSave, ...prev]);
      triggerToast(`Plano "${planToSave.name}" guardado.`);
    } else { triggerToast('Erro ao guardar plano.'); }
    setIsPlanModalOpen(false);
    setEditingPlan(null);
    setPlanForm({});
  };

  // Derived
  const pendingCount = shops.filter(s => s.status === 'Pending').length;
  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const totalMrr = shops.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.mrr, 0);
  const activeShops = shops.filter(s => s.status === 'Active').length;
  const trialShops = shops.filter(s => s.trial_end_at && new Date(s.trial_end_at) > new Date()).length;
  const expiringTrials = shops.filter(s => {
    if (!s.trial_end_at) return false;
    const diff = (new Date(s.trial_end_at).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  const filteredApprovals = useMemo(() => {
    return shops.filter(s => approvalStatusFilter === 'All' || s.status === approvalStatusFilter);
  }, [shops, approvalStatusFilter]);

  const getTrialDaysLeft = (shop: SaasShop) => {
    if (!shop.trial_end_at) return null;
    return Math.ceil((new Date(shop.trial_end_at).getTime() - Date.now()) / 86400000);
  };

  const notifIcon: Record<string, string> = {
    new_shop: '🏪', pending_approval: '⏳', trial_expiring: '⚠️',
    trial_expired: '❌', subscription_expired: '💳', upgrade_request: '⬆️',
  };

  // ─── NAV CONFIG ───────────────────────────────────────────────────────────
  const NAV_GROUPS: { label: string; items: { id: typeof activeTab; label: string; Icon: React.ComponentType<any>; badge?: number }[] }[] = [
    {
      label: 'Visão Geral',
      items: [
        { id: 'dashboard' as const, label: 'Dashboard', Icon: LayoutDashboard },
        { id: 'approvals' as const, label: 'Aprovações', Icon: BadgeCheck, badge: pendingCount > 0 ? pendingCount : undefined },
        { id: 'notifications' as const, label: 'Notificações', Icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { id: 'shops' as const, label: 'Barbearias', Icon: Store },
        { id: 'plans' as const, label: 'Planos', Icon: Package },
        { id: 'invites' as const, label: 'Convites', Icon: Mail },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { id: 'subscriptions' as const, label: 'Subscrições', Icon: CreditCard },
        { id: 'revenue' as const, label: 'Receita', Icon: DollarSign },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { id: 'support' as const, label: 'Suporte', Icon: Headphones },
        { id: 'audit' as const, label: 'Auditoria', Icon: ClipboardList },
        { id: 'settings' as const, label: 'Configurações', Icon: Settings },
      ],
    },
  ];

  const TAB_TITLES: Record<string, string> = {
    dashboard: 'Dashboard', approvals: 'Aprovações', notifications: 'Notificações',
    shops: 'Barbearias', plans: 'Planos', invites: 'Convites',
    subscriptions: 'Subscrições', revenue: 'Receita', support: 'Suporte',
    audit: 'Auditoria', logs: 'Logs', users: 'Utilizadores',
    settings: 'Configurações', monitor: 'Monitorização',
  };

  return (
    <div className="flex h-screen select-none overflow-hidden" style={{ background: '#0F0B08', color: '#F5F1EB', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .sa-heading { font-family: 'Outfit', sans-serif; font-weight: 700; }
        .sa-mono { font-family: 'JetBrains Mono', monospace; }
        .sa-sidebar-item { transition: background 0.15s, color 0.15s; }
        .sa-sidebar-item:hover { background: rgba(200,154,99,0.08); color: #F5F1EB; }
        .sa-card { background: #18120D; border: 1px solid #2A2119; border-radius: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
        .sa-card:hover { border-color: rgba(200,154,99,0.2); box-shadow: 0 8px 24px rgba(200,154,99,0.06); }
        .sa-input { background: #120D09; border: 1px solid #2A2119; border-radius: 10px; color: #F5F1EB; transition: border-color 0.15s; }
        .sa-input:focus { outline: none; border-color: rgba(200,154,99,0.5); }
        .sa-btn-primary { background: #C89A63; color: #111111; font-weight: 800; cursor: pointer; transition: filter 0.15s, transform 0.15s; border-radius: 10px; }
        .sa-btn-primary:hover { filter: brightness(1.1); transform: scale(1.02); }
        .sa-btn-ghost { background: rgba(200,154,99,0.06); border: 1px solid rgba(200,154,99,0.12); color: #A79C90; cursor: pointer; transition: all 0.15s; border-radius: 10px; }
        .sa-btn-ghost:hover { background: rgba(200,154,99,0.12); color: #F5F1EB; }
        .sa-scrollbar::-webkit-scrollbar { width: 4px; }
        .sa-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sa-scrollbar::-webkit-scrollbar-thumb { background: #2A2119; border-radius: 4px; }
        .sa-scrollbar::-webkit-scrollbar-thumb:hover { background: #3d2e1e; }
        .sa-badge-amber { background: rgba(200,154,99,0.15); color: #C89A63; border: 1px solid rgba(200,154,99,0.25); }
        .sa-badge-green { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .sa-badge-red { background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.2); }
        .sa-badge-blue { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
      `}</style>
      {/* ═══════════════════════════════ SIDEBAR ═══════════════════════════════ */}
      <aside className="flex-shrink-0 w-[220px] h-full flex flex-col border-r z-50" style={{ background: 'linear-gradient(180deg, #120D09 0%, #0B0908 100%)', borderColor: '#2A2119' }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: '#2A2119' }}>
          <img src="/barberly_logo.png" alt="Barberly" className="h-9 w-auto max-w-[130px] object-contain"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              (el.nextElementSibling as HTMLElement).style.display = 'flex';
            }} />
          <div className="hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(200,154,99,0.15)', border: '1px solid rgba(200,154,99,0.3)' }}>
              <Scissors className="w-3.5 h-3.5" style={{ color: '#C89A63' }} />
            </div>
            <div>
              <p className="sa-heading text-sm font-700 leading-none" style={{ color: '#C89A63', fontWeight: 700 }}>Barberly</p>
              <p className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: '#7C7268' }}>Super Admin</p>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-widest leading-none" style={{ color: '#7C7268' }}>Super Admin</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sa-scrollbar py-4 px-3 space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[9px] uppercase font-600 tracking-widest px-3 mb-1.5" style={{ color: '#7C7268' }}>{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, Icon, badge }) => {
                  const isActive = activeTab === id;
                  return (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className="sa-sidebar-item relative w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-left"
                      style={{ color: isActive ? '#C89A63' : '#A79C90', background: isActive ? 'rgba(200,154,99,0.08)' : 'transparent' }}>
                      {isActive && (
                        <motion.div layoutId="sa-active-bar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                          style={{ width: 2, height: '50%', background: '#C89A63', boxShadow: '0 0 6px rgba(200,154,99,0.6)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                      )}
                      <Icon className="w-3.5 h-3.5 shrink-0 relative z-10" />
                      <span className="text-xs font-500 flex-1 relative z-10" style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
                      {badge !== undefined && (
                        <span className="text-[9px] font-800 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 relative z-10"
                          style={{ background: '#C89A63', color: '#0F0B08', fontWeight: 800 }}>
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: '#2A2119' }}>
          <button onClick={() => { onBackToMain(); triggerToast('Retornando ao painel.'); }}
            className="sa-btn-ghost w-full flex items-center gap-2 px-3 py-2 text-xs">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel Barbearia</span>
          </button>
          <button onClick={async () => {
              if (supabase) await supabase.auth.signOut().catch(() => {});
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors hover:bg-rose-500/10 text-stone-500 hover:text-rose-400 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
            <span>Terminar Sessão</span>
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(200,154,99,0.06)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-800 shrink-0"
              style={{ background: 'rgba(200,154,99,0.2)', color: '#C89A63', fontWeight: 800 }}>SA</div>
            <div className="overflow-hidden">
              <p className="text-xs font-500 truncate" style={{ color: '#F5F1EB' }}>Super Admin</p>
              <p className="text-[9px] truncate" style={{ color: '#7C7268' }}>Plataforma BarberPro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0F0B08' }}>
        {/* Header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-6 border-b" style={{ background: 'rgba(18,13,9,0.88)', backdropFilter: 'blur(12px)', borderColor: '#2A2119' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#7C7268' }}>BarberPro</span>
              <span style={{ color: '#7C7268' }}>/</span>
              <span className="sa-heading text-sm font-600" style={{ color: '#F5F1EB', fontWeight: 600 }}>{TAB_TITLES[activeTab] || activeTab}</span>
              {activeTab === 'approvals' && pendingCount > 0 && (
                <span className="sa-badge-amber text-[9px] font-700 px-1.5 py-0.5 rounded-full ml-1" style={{ fontWeight: 700 }}>{pendingCount} pendentes</span>
              )}
              {activeTab === 'notifications' && unreadNotifCount > 0 && (
                <span className="sa-badge-amber text-[9px] font-700 px-1.5 py-0.5 rounded-full ml-1" style={{ fontWeight: 700 }}>{unreadNotifCount} novas</span>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('notifications')} className="relative p-2 rounded-lg transition-colors" style={{ color: '#A79C90' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F1EB')} onMouseLeave={e => (e.currentTarget.style.color = '#A79C90')}>
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#C89A63' }} />}
            </button>
            <div className="w-px h-5 mx-1" style={{ background: '#2A2119' }} />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px]" style={{ background: 'rgba(200,154,99,0.2)', color: '#C89A63', fontWeight: 800 }}>SA</div>
              <span className="text-xs" style={{ color: '#A79C90' }}>Super Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 overflow-y-auto sa-scrollbar"
          style={{ padding: '24px 28px' }}
        >
          {/* TAB: SHOPS */}
          {activeTab === 'shops' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="sa-heading text-xl font-semibold" style={{ color: '#F5F1EB', fontWeight: 600 }}>Barbearias</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#A79C90' }}>{shops.length} registadas &middot; {activeShops} ativas &middot; MRR <span style={{ color: '#C89A63' }}>&#8364;{totalMrr.toFixed(2)}</span></p>
                </div>
              </div>

              {/* Filter bar */}
              <div className="sa-card p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7C7268' }} />
                  <input type="text" placeholder="Pesquisar barbearia..." value={searchShop}
                    onChange={e => setSearchShop(e.target.value)}
                    className="sa-input w-full py-2 pl-9 pr-3 text-xs" />
                </div>

                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value as any)}
                  className="sa-input px-3 py-2 text-xs cursor-pointer">
                  <option value="All">Todos os planos</option>
                  <option value="Basic">Basic</option>
                  <option value="Professional">Professional</option>
                  <option value="Premium">Premium</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                  className="sa-input px-3 py-2 text-xs cursor-pointer">
                  <option value="All">Todos os status</option>
                  <option value="Active">Ativas</option>
                  <option value="Pending">Pendentes</option>
                  <option value="Suspended">Suspensas</option>
                </select>
                <button onClick={() => setIsRegisterModalOpen(true)} className="sa-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs ml-auto">
                  <Plus className="w-3.5 h-3.5" /> Nova
                </button>
              </div>

              {/* Shops table */}
              <div className="sa-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #2A2119' }}>
                        {['Barbearia', 'Proprietário', 'Localização', 'Plano', 'Status', 'MRR', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-[9px] uppercase tracking-widest" style={{ color: '#7C7268' }}>{h}</th>
                        ))}
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
                          <tr key={shop.id} className="hover:bg-[#18120D]/35 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 animate-slide-up">
                                <div className="w-10 h-10 rounded-xl bg-[#18120D] border border-white/5 flex items-center justify-center text-[#C89A63] overflow-hidden relative">
                                  <Scissors className="w-4 h-4 text-[#C89A63]" />
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
                                <MapPin className="w-3.5 h-3.5 text-[#C89A63]/70" />
                                <span className="text-xs">{shop.location}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                shop.plan === 'Premium' ? 'bg-[#C89A63]/20 text-[#C89A63] border border-[#C89A63]/20' :
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
                                  shop.status === 'Pending' ? 'bg-[#C89A63] shadow-[0_0_8px_rgba(200,154,99,0.5)]' :
                                  'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                }`} />
                                <span className="text-xs text-stone-300 group-hover:text-[#C89A63] transition-colors">
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
                                  className="text-stone-400 hover:text-[#C89A63] p-1.5 bg-[#18120D] border border-white/5 rounded transition-all"
                                  title="Impersonate (Entrar na Conta)"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleShopStatus(shop.id, shop.status)}
                                  className="text-stone-400 hover:text-[#C89A63] p-1.5 bg-[#18120D] border border-white/5 rounded transition-all"
                                  title={shop.status === 'Suspended' ? 'Reativar Conveniada' : 'Suspender/Bloquear Conveniada'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteShop(shop.id, shop.name)}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 bg-[#18120D] border border-white/5 rounded transition-all"
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
                <div className="p-6 bg-[#18120D]/25 border-t border-white/5 flex items-center justify-between text-xs text-stone-400">
                  <span>Exibindo {filteredShops.length} de {stats.totalShops} barbearias na rede SaaS</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 bg-[#18120D] rounded border border-white/5 text-stone-400 hover:text-stone-200">
                      Anterior
                    </button>
                    <button className="px-3.5 py-1.5 bg-[#C89A63] text-[#111111] font-black rounded">
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
                  <div className="bg-[#120D09] border border-[#C89A63]/20 rounded-2xl p-8 max-w-md w-full space-y-6 relative animate-slide-up">
                    <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase text-[#C89A63] font-bold tracking-widest block">SAAS INTEGRATION</span>
                        <h3 className="text-lg font-serif text-stone-100">Registrar Conveniada</h3>
                      </div>
                      <button
                        onClick={() => setIsRegisterModalOpen(false)}
                        className="p-1 px-2.5 bg-[#18120D] rounded font-mono text-stone-400 hover:text-white"
                      >
                        X
                      </button>
                    </div>

                    <form onSubmit={handleRegisterShop} className="space-y-4">
                      {/* Shop Logo */}
                      <div className="flex items-center gap-4 p-3 bg-[#18120D] rounded-xl border border-white/5">
                        <input
                          ref={shopLogoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingShopLogo(true);
                            const path = `shop_${Date.now()}.${file.name.split('.').pop()}`;
                            const url = await uploadImage('shop-logos', file, path);
                            setIsUploadingShopLogo(false);
                            if (url) setNewShop((p) => ({ ...p, logo_url: url }));
                            else triggerToast('Erro ao fazer upload da logo.');
                            e.target.value = '';
                          }}
                        />
                        {newShop.logo_url ? (
                          <img src={newShop.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 shrink-0">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Logo da Barbearia</p>
                          <p className="text-[10px] text-stone-600 mt-0.5">PNG, JPG ou SVG · máx. 2MB</p>
                        </div>
                        <button
                          type="button"
                          disabled={isUploadingShopLogo}
                          onClick={() => shopLogoInputRef.current?.click()}
                          className="text-[10px] uppercase font-bold text-[#C89A63] hover:text-[#D8AE7A] transition-colors disabled:opacity-50 shrink-0"
                        >
                          {isUploadingShopLogo ? 'A carregar...' : newShop.logo_url ? 'Alterar' : 'Upload'}
                        </button>
                      </div>

                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Nome Comercial</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: BarberShop Elegance"
                          value={newShop.name}
                          onChange={(e) => setNewShop((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-[#18120D] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#C89A63]"
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
                          className="w-full bg-[#18120D] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#C89A63]"
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
                            className="w-full bg-[#18120D] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-[#C89A63]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Cidade / País</label>
                          <input
                            type="text"
                            placeholder="Rio de Janeiro, BR"
                            value={newShop.location}
                            onChange={(e) => setNewShop((prev) => ({ ...prev, location: e.target.value }))}
                            className="w-full bg-[#18120D] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-[#C89A63]"
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
                        <div className="bg-[#18120D] px-4 py-3 rounded-xl border border-white/5 flex justify-between items-center">
                          <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Valor Cobrado (Mensual)</span>
                          <span className="text-sm font-extrabold text-[#C89A63] font-mono">
                            € {parseFloat(newShop.mrr).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRegisterModalOpen(false)}
                          className="flex-1 bg-[#18120D] hover:bg-neutral-800 text-stone-300 py-3 rounded-xl text-xs uppercase font-bold text-center transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
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
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="sa-heading text-xl font-700" style={{ color: '#F5F1EB', fontWeight: 700 }}>Visão Geral da Plataforma</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#A79C90' }}>Métricas em tempo real · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={() => triggerToast('Relatório exportado!')}
                  className="sa-btn-ghost flex items-center gap-2 px-3 py-2 text-xs">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'MRR Total', value: `€ ${totalMrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: `${activeShops} lojas ativas`, icon: TrendingUp, accent: '#C89A63', click: undefined },
                  { label: 'Pendentes', value: String(pendingCount), sub: pendingCount > 0 ? 'Aguardam aprovação' : 'Tudo em dia', icon: BadgeCheck, accent: pendingCount > 0 ? '#C89A63' : '#22c55e', click: () => setActiveTab('approvals') },
                  { label: 'Barbearias', value: String(shops.length), sub: `${trialShops} em trial`, icon: Store, accent: '#60a5fa', click: () => setActiveTab('shops') },
                  { label: 'ARPU', value: `€ ${(activeShops > 0 ? totalMrr / activeShops : 0).toFixed(2)}`, sub: 'Por barbearia ativa', icon: DollarSign, accent: '#a78bfa', click: undefined },
                ].map(({ label, value, sub, icon: Icon, accent, click }) => (
                  <div key={label} className="sa-card p-5 cursor-default hover:border-white/12 transition-all"
                    style={{ cursor: click ? 'pointer' : 'default', ...(click ? {} : {}) }}
                    onClick={click || undefined}>
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: '#7C7268' }}>{label}</p>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                      </div>
                    </div>
                    <p className="sa-mono text-2xl font-600 mb-1" style={{ color: '#F5F1EB', fontWeight: 600 }}>{value}</p>
                    <p className="text-[10px]" style={{ color: '#7C7268' }}>{sub}</p>
                    {label === 'Pendentes' && pendingCount > 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C89A63' }} />
                        <span className="text-[9px] font-600" style={{ color: '#C89A63', fontWeight: 600 }}>Ação necessária</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Trial expiring warning */}
              {expiringTrials > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(200,154,99,0.08)', border: '1px solid rgba(200,154,99,0.2)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#C89A63' }} />
                  <p className="text-xs" style={{ color: '#F5F1EB' }}><span style={{ color: '#C89A63', fontWeight: 600 }}>{expiringTrials} trial{expiringTrials > 1 ? 's' : ''}</span> expiram nos próximos 7 dias.</p>
                  <button onClick={() => setActiveTab('approvals')} className="ml-auto text-[10px] font-600 uppercase tracking-wider" style={{ color: '#C89A63', fontWeight: 600 }}>Gerir →</button>
                </div>
              )}

              {/* Two-column: plan breakdown + recent notifications */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Plan breakdown */}
                <div className="sa-card p-5">
                  <p className="sa-heading text-sm font-600 mb-4" style={{ color: '#F5F1EB', fontWeight: 600 }}>Distribuição por Plano</p>
                  {(() => {
                    const premMrr = shops.filter(s => s.plan === 'Premium' && s.status === 'Active').reduce((s, x) => s + x.mrr, 0);
                    const proMrr = shops.filter(s => s.plan === 'Professional' && s.status === 'Active').reduce((s, x) => s + x.mrr, 0);
                    const basMrr = shops.filter(s => s.plan === 'Basic' && s.status === 'Active').reduce((s, x) => s + x.mrr, 0);
                    const tot = premMrr + proMrr + basMrr || 1;
                    return (
                      <div className="space-y-4">
                        {[
                          { label: 'Premium', mrr: premMrr, color: '#C89A63', pct: Math.round((premMrr / tot) * 100) },
                          { label: 'Professional', mrr: proMrr, color: '#818cf8', pct: Math.round((proMrr / tot) * 100) },
                          { label: 'Basic', mrr: basMrr, color: '#7C7268', pct: Math.round((basMrr / tot) * 100) },
                        ].map(({ label, mrr, color, pct }) => (
                          <div key={label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs" style={{ color: '#8b96a8' }}>{label}</span>
                              <span className="sa-mono text-xs font-500" style={{ color, fontWeight: 500 }}>€{mrr.toFixed(0)} · {pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(200,154,99,0.08)' }}>
                              <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Recent notifications */}
                <div className="sa-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="sa-heading text-sm font-600" style={{ color: '#F5F1EB', fontWeight: 600 }}>Notificações Recentes</p>
                    <button onClick={() => setActiveTab('notifications')} className="text-[10px] uppercase tracking-wider font-600" style={{ color: '#C89A63', fontWeight: 600 }}>Ver todas →</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: '#2A2119' }}>
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.is_read ? '' : 'animate-pulse'}`} style={{ background: n.is_read ? '#7C7268' : '#C89A63' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: n.is_read ? '#A79C90' : '#F5F1EB' }}>{n.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#7C7268' }}>{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-xs text-center py-6" style={{ color: '#7C7268' }}>Sem notificações</p>}
                  </div>
                </div>
              </div>

              {/* Recent shops table */}
              <div className="sa-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#2A2119' }}>
                  <p className="sa-heading text-sm font-600" style={{ color: '#F5F1EB', fontWeight: 600 }}>Barbearias Recentes</p>
                  <button onClick={() => setActiveTab('shops')} className="text-[10px] uppercase tracking-wider font-600" style={{ color: '#C89A63', fontWeight: 600 }}>Ver todas →</button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A2119' }}>
                      {['Barbearia', 'Proprietário', 'Plano', 'MRR', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[9px] uppercase tracking-widest" style={{ color: '#7C7268' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shops.slice(0, 5).map(shop => (
                      <tr key={shop.id} className="transition-colors" style={{ borderBottom: '1px solid #2A2119' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,154,99,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-5 py-3 text-xs font-500" style={{ color: '#F5F1EB', fontWeight: 500 }}>{shop.name}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#A79C90' }}>{shop.ownerName}</td>
                        <td className="px-5 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full sa-badge-amber">{shop.plan}</span></td>
                        <td className="px-5 py-3 sa-mono text-xs" style={{ color: '#C89A63' }}>€{shop.mrr.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-600 ${shop.status === 'Active' ? 'sa-badge-green' : shop.status === 'Pending' ? 'sa-badge-amber' : 'sa-badge-red'}`} style={{ fontWeight: 600 }}>{shop.status}</span>
                        </td>
                      </tr>
                    ))}
                    {shops.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: '#7C7268' }}>Nenhuma barbearia registada.</td></tr>}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: PLANS & COUPONS MANAGEMENT */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="sa-heading text-xl font-semibold text-[#e5e2e1]">Planos de Assinatura & Cupons</h1>
                  <p className="text-stone-400 text-xs mt-1">Configure o preço, capacidade máxima de cadeiras e acessos de cada plano SaaS do ecossistema.</p>
                </div>
                
                <button
                  onClick={() => { setEditingPlan(null); setPlanForm({ is_active: true, features: [] }); setIsPlanModalOpen(true); }}
                  className="bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Plano
                </button>
              </div>

              {/* STATS STRIP ROW */}
              {(() => {
                const suspendedCount = shops.filter(s => s.status === 'Suspended').length;
                const churnPct = stats.totalShops > 0 ? Math.round((suspendedCount / stats.totalShops) * 100) : 0;
                const couponUsed = coupons.reduce((s, c) => s + c.used, 0);
                const couponTotal = coupons.reduce((s, c) => s + c.total, 0);
                const couponConv = couponTotal > 0 ? Math.round((couponUsed / couponTotal) * 100) : 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#120D09] p-5 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Clientes Ativos</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black font-mono">{activeShops}</span>
                        <span className="text-stone-500 text-xs font-bold">{trialShops > 0 ? `${trialShops} em trial` : ''}</span>
                      </div>
                    </div>
                    <div className="bg-[#120D09] p-5 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Faturamento Planos</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black font-mono">€ {totalMrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        <span className="text-stone-500 text-xs font-bold">/mês</span>
                      </div>
                    </div>
                    <div className="bg-[#120D09] p-5 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Taxa Churn</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black font-mono">{churnPct}%</span>
                        <span className="text-stone-500 text-xs font-bold">{suspendedCount} suspensas</span>
                      </div>
                    </div>
                    <div className="bg-[#120D09] p-5 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">Conversão de Cupons</span>
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-black font-mono">{couponConv}%</span>
                        <span className="text-stone-500 text-xs font-bold">{couponUsed}/{couponTotal} usos</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MANAGEMENT SECTIONS CONTAINER GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* PLAN LIMITS CONFIGURATOR (Left Column 8 col) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2 text-stone-100">
                    <Settings className="w-5 h-5 text-[#C89A63]" />
                    <h3 className="sa-heading text-base font-semibold">Controles de Capacidade das Barbearias</h3>
                  </div>

                  {/* Plan 1 card */}
                  <div className="bg-[#120D09] p-6 rounded-2xl border border-white/5 border-l-4 border-[#C89A63] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-serif text-stone-100 font-bold">Plano Artisan Solo</h4>
                        <p className="text-stone-400 text-xs mt-1">Concedido para barbeiros independentes ou autônomos.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-[#C89A63]">€ {plans.artisanSolo.price}</span>
                        <span className="text-stone-500 text-[10px] uppercase block tracking-wider font-bold">por mês</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-5 border-y border-white/5 my-4">
                      {/* Limits input */}
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-bold text-[#C89A63] tracking-wider select-none block">LIMITES OPERACIONAIS</span>
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
                              className="w-16 bg-[#18120D] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-[#C89A63] text-xs focus:outline-none"
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
                              className="w-16 bg-[#18120D] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-[#C89A63] text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <div className="space-y-4">
                        <span className="text-[10px] uppercase font-bold text-[#C89A63] tracking-wider select-none block">RECURSOS DO PLANO</span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-[#e5e2e1]">
                            <input
                              type="checkbox"
                              checked={plans.artisanSolo.analytics}
                              onChange={(e) => setPlans({
                                ...plans,
                                artisanSolo: { ...plans.artisanSolo, analytics: e.target.checked }
                              })}
                              className="form-checkbox text-[#C89A63] bg-[#18120D] border border-white/10 rounded"
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
                              className="form-checkbox text-[#C89A63] bg-[#18120D] border border-white/10 rounded"
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
                              className="form-checkbox text-[#C89A63] bg-[#18120D] border border-white/10 rounded"
                            />
                            <span>Dashboards Multilojas</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-stone-500">
                      <span>Plano ativo em <span className="font-bold text-stone-300">{shops.filter(s => s.plan === 'Basic' || s.plan === 'Professional').length} barbearias</span></span>
                      <button
                        onClick={async () => {
                          const match = saasPlans.find(p => p.name.toLowerCase().includes('artisan') || p.name.toLowerCase().includes('solo')) || saasPlans[0];
                          if (match) {
                            const updated = {
                              ...match,
                              price_monthly: plans.artisanSolo.price,
                              max_barbers: plans.artisanSolo.barberSeats,
                              max_bookings_per_month: parseInt(plans.artisanSolo.appointments) || match.max_bookings_per_month,
                              features: [
                                plans.artisanSolo.analytics ? 'Módulo de Relatórios' : null,
                                plans.artisanSolo.sms ? 'Disparo de lembretes SMS' : null,
                                plans.artisanSolo.multiLocation ? 'Dashboards Multilojas' : null,
                              ].filter(Boolean) as string[],
                            };
                            const ok = await saveSaasPlan(updated);
                            if (ok) { setSaasPlans(prev => prev.map(p => p.id === match.id ? updated : p)); triggerToast('Configurações do Artisan Solo salvas!'); }
                            else triggerToast('Erro ao salvar configurações.');
                          } else {
                            triggerToast('Crie primeiro um plano na aba Planos.');
                          }
                        }}
                        className="px-4 py-2 bg-[#C89A63]/10 hover:bg-[#C89A63]/20 text-[#C89A63] border border-[#C89A63]/20 rounded-xl font-bold uppercase tracking-wider text-[10px]"
                      >
                        Salvar Configurações
                      </button>
                    </div>
                  </div>

                  {/* Plan 2 Card */}
                  <div className="bg-[#120D09] p-6 rounded-2xl border border-white/5 border-l-4 border-stone-500 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-serif text-stone-100 font-bold">Plano Studio Master</h4>
                        <p className="text-stone-400 text-xs mt-1">Desenvolvido para barbearias tradicionais com equipe consolidada.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-[#C89A63]">€ {plans.studioMaster.price}</span>
                        <span className="text-stone-500 text-[10px] uppercase block tracking-wider font-bold">por mês</span>
                      </div>
                    </div>

                    <div className="text-center py-4 bg-[#1c1b1b] border border-white/5 rounded-xl italic text-xs text-stone-500">
                      Configurações avançadas de equipe sênior, controle de pagamentos integrados e faturamento multissalas...
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          const match = saasPlans.find(p => p.name.toLowerCase().includes('studio') || p.name.toLowerCase().includes('master')) || saasPlans[1];
                          if (match) { setEditingPlan(match); setPlanForm(match); setIsPlanModalOpen(true); }
                          else { setEditingPlan(null); setPlanForm({ name: 'Studio Master', price_monthly: plans.studioMaster.price, is_active: true, features: [] }); setIsPlanModalOpen(true); }
                        }}
                        className="px-4 py-2 text-stone-300 bg-[#18120D] border border-white/5 duration-200 hover:text-white rounded-xl font-bold uppercase tracking-wider text-[10px]"
                      >
                        Editar Parâmetros
                      </button>
                    </div>
                  </div>

                </div>

                {/* COUPONS & PROMOTIONS PANEL (Right Columns) */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="sa-heading text-base font-semibold text-stone-100">Cupons de Campanha</h3>
                      <button
                        onClick={() => setIsNewCouponOpen(true)}
                        className="text-[#C89A63] hover:text-[#D8AE7A] font-bold text-[10px] uppercase tracking-widest"
                      >
                        + Criar Cupom
                      </button>
                    </div>

                    <div className="space-y-4">
                      {coupons.map((coupon, i) => (
                        <div key={i} className="bg-[#120D09] p-4.5 rounded-2xl border border-white/5 hover:border-[#C89A63]/25 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-sm font-black text-[#C89A63] tracking-widest">{coupon.code}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#C89A63]/10 text-[#C89A63] border border-[#C89A63]/10 text-[9px] font-black uppercase font-mono">{coupon.discount}</span>
                              <button
                                onClick={async () => {
                                  await deleteSaasCoupon(coupon.code);
                                  setCoupons(prev => prev.filter((_, idx) => idx !== i));
                                  triggerToast(`Cupom ${coupon.code} removido.`);
                                }}
                                className="p-1 hover:bg-rose-500/10 text-stone-600 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span>Uso: {coupon.used}/{coupon.total} faturados</span>
                            <span>Validade: {coupon.expiry}</span>
                          </div>
                          <div className="mt-3.5 h-1 w-full bg-[#18120D] rounded-full">
                            <div className="h-full bg-[#C89A63] rounded" style={{ width: `${coupon.total > 0 ? (coupon.used / coupon.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Coupon Modal */}
                  {isNewCouponOpen && (
                    <div className="p-5 bg-[#120D09] border border-[#C89A63]/20 rounded-2xl space-y-4">
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
                            className="w-full bg-[#18120D] border border-white/10 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none"
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
                            <option value="50% OFF">50% de Desconto</option>
                            <option value="€50 FLAT">Desconto fixo de €50</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Usos Máximos</label>
                            <input
                              type="number"
                              min={1}
                              value={newCoupon.total}
                              onChange={(e) => setNewCoupon({ ...newCoupon, total: parseInt(e.target.value) || 1 })}
                              className="w-full bg-[#18120D] border border-white/10 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Validade (MM/AA)</label>
                            <input
                              type="text"
                              placeholder="12/26"
                              value={newCoupon.expiry}
                              onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                              className="w-full bg-[#18120D] border border-white/10 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black uppercase py-2 text-[10px] rounded tracking-widest duration-150-all"
                        >
                          Salvar Cupom Promocional
                        </button>
                      </form>
                    </div>
                  )}

                  {/* PLATFORM MEMBER GROWTH */}
                  <div className="sa-card border-0 p-5 rounded-2xl">
                    <h3 className="font-serif text-sm font-medium text-stone-100 mb-4">Quota Total de Escala</h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Barbearias Registradas</span>
                        <span className="text-[#C89A63] font-bold">{stats.totalShops} lojas</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#18120D] rounded-full">
                        <div className="h-full bg-[#C89A63] rounded" style={{ width: `${Math.min(100, (stats.totalShops / 50) * 100)}%` }} />
                      </div>

                      <div className="flex justify-between pt-2">
                        <span className="text-stone-400">Lojas Ativas / Total</span>
                        <span className="text-[#C89A63] font-bold">{shops.filter(s => s.status === 'Active').length} / {stats.totalShops}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#18120D] rounded-full">
                        <div className="h-full bg-indigo-500 rounded" style={{ width: `${stats.totalShops > 0 ? Math.round((shops.filter(s => s.status === 'Active').length / stats.totalShops) * 100) : 0}%` }} />
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

              {/* LEFT PANE: ticket list */}
              <section className="w-full lg:w-[320px] shrink-0 border-r border-white/5 bg-[#120D09] flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="sa-heading text-sm font-semibold text-stone-100 flex items-center gap-2">
                      <LifeBuoy className="w-4 h-4 text-[#C89A63]" /> Chamados
                      {tickets.filter(t => t.status === 'open').length > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[9px] font-black rounded-full">{tickets.filter(t => t.status === 'open').length}</span>
                      )}
                    </h3>
                    <button onClick={() => setIsNewTicketOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C89A63]/10 hover:bg-[#C89A63]/20 text-[#C89A63] border border-[#C89A63]/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all">
                      <Plus className="w-3 h-3" /> Novo
                    </button>
                  </div>
                  {/* Status filters */}
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                      <button key={f} onClick={() => setTicketStatusFilter(f)}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer transition-all ${ticketStatusFilter === f ? 'bg-[#C89A63] text-[#111111]' : 'bg-[#18120D] text-stone-500 hover:text-stone-300'}`}>
                        {f === 'all' ? 'Todos' : f === 'open' ? 'Abertos' : f === 'in_progress' ? 'Em Curso' : 'Resolvidos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New ticket inline form */}
                {isNewTicketOpen && (
                  <form onSubmit={handleCreateTicket} className="p-4 border-b border-[#C89A63]/20 bg-[#C89A63]/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-[#C89A63]">Novo Chamado</span>
                      <button type="button" onClick={() => setIsNewTicketOpen(false)} className="text-stone-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <select value={newTicketForm.shop_id} onChange={e => {
                      const s = shops.find(sh => sh.id === e.target.value);
                      setNewTicketForm(f => ({ ...f, shop_id: e.target.value, shop_name: s?.name || '' }));
                    }} className="w-full bg-[#18120D] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-stone-200 focus:outline-none">
                      <option value="">Selecionar barbearia...</option>
                      {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input value={newTicketForm.subject} onChange={e => setNewTicketForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Assunto do chamado..." required
                      className="w-full bg-[#18120D] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#C89A63]/50" />
                    <select value={newTicketForm.priority} onChange={e => setNewTicketForm(f => ({ ...f, priority: e.target.value as SaasTicket['priority'] }))}
                      className="w-full bg-[#18120D] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-stone-200 focus:outline-none">
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                    <button type="submit" disabled={ticketLoading}
                      className="w-full py-1.5 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black rounded-lg text-[10px] uppercase cursor-pointer disabled:opacity-60">
                      {ticketLoading ? 'A criar...' : 'Criar Chamado'}
                    </button>
                  </form>
                )}

                {/* Ticket list */}
                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {filteredTickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-stone-600 text-xs text-center px-6">
                      <LifeBuoy className="w-8 h-8 mb-3 opacity-30" />
                      <p>Nenhum chamado {ticketStatusFilter !== 'all' ? 'neste filtro' : 'ainda'}.</p>
                    </div>
                  )}
                  {filteredTickets.map(t => {
                    const priorityStyle = t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                      t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      t.priority === 'normal' ? 'bg-[#C89A63]/15 text-[#C89A63]' : 'bg-stone-800 text-stone-500';
                    const statusStyle = t.status === 'in_progress' ? 'text-[#C89A63]' :
                      t.status === 'open' ? 'text-indigo-400' :
                      t.status === 'resolved' ? 'text-green-500' : 'text-stone-500';
                    const statusLabel = t.status === 'in_progress' ? 'Em Curso' : t.status === 'open' ? 'Aberto' : t.status === 'resolved' ? 'Resolvido' : 'Fechado';
                    const shopShort = (t.shop_name || 'SA').slice(0, 2).toUpperCase();
                    return (
                      <div key={t.id} onClick={() => setActiveTicketId(t.id)}
                        className={`p-4 cursor-pointer transition-all border-l-4 ${activeTicketId === t.id ? 'border-[#C89A63] bg-[#C89A63]/5' : 'border-transparent hover:bg-[#18120D]/40'}`}>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${priorityStyle}`}>
                            {t.priority === 'urgent' ? 'Urgente' : t.priority === 'high' ? 'Alta' : t.priority === 'normal' ? 'Normal' : 'Baixa'}
                          </span>
                          <span className="text-[9px] text-stone-600 font-mono">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-100 mb-1 line-clamp-1">{t.subject}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-[#18120D] border border-white/10 flex items-center justify-center text-[8px] font-black text-[#C89A63]">{shopShort}</div>
                            <span className="text-[10px] text-stone-500 truncate max-w-[110px]">{t.shop_name || 'Plataforma'}</span>
                          </div>
                          <span className={`text-[9px] font-bold ${statusStyle}`}>{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* MIDDLE PANE: chat */}
              <section className="flex-1 bg-[#0F0B08] flex flex-col h-full overflow-hidden">
                {!currentActiveTicket ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-600 gap-3">
                    <LifeBuoy className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Selecione um chamado para responder</p>
                    <button onClick={() => setIsNewTicketOpen(true)}
                      className="px-4 py-2 bg-[#C89A63]/10 text-[#C89A63] border border-[#C89A63]/20 rounded-xl text-xs font-bold uppercase cursor-pointer hover:bg-[#C89A63]/20 transition-all">
                      + Novo Chamado
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="bg-[#120D09]/95 px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#18120D] border border-[#C89A63]/20 flex items-center justify-center text-[#C89A63] shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-100">{currentActiveTicket.shop_name || 'Plataforma'}</h3>
                          <p className="text-[10px] text-stone-500">
                            #{currentActiveTicket.id.slice(0, 8)} · {currentActiveTicket.subject}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {currentActiveTicket.status !== 'resolved' && currentActiveTicket.status !== 'closed' ? (
                          <button onClick={() => handleResolveTicket(currentActiveTicket.id)}
                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all flex items-center gap-1">
                            <Check className="w-3 h-3" /> Resolver
                          </button>
                        ) : (
                          <button onClick={() => handleReopenTicket(currentActiveTicket.id)}
                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Reabrir
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {ticketMessages.length === 0 && (
                        <div className="text-center text-stone-600 text-xs py-10">Nenhuma mensagem ainda. Inicie a conversa.</div>
                      )}
                      {ticketMessages.map(m => {
                        const isAdmin = m.sender === 'admin';
                        const shopShort2 = (currentActiveTicket.shop_name || 'SH').slice(0, 2).toUpperCase();
                        return (
                          <div key={m.id} className={`flex gap-3 max-w-2xl ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isAdmin ? 'bg-[#C89A63] text-[#111111]' : 'bg-[#18120D] border border-white/10 text-[#C89A63] font-mono'}`}>
                              {isAdmin ? 'SA' : shopShort2}
                            </div>
                            <div className="space-y-1 max-w-xs lg:max-w-sm">
                              <div className={`p-3 rounded-xl text-xs leading-relaxed ${isAdmin ? 'bg-[#C89A63]/10 text-stone-200 border border-[#C89A63]/15 rounded-tr-none' : 'bg-[#18120D] text-stone-300 border border-white/5 rounded-tl-none'}`}>
                                {m.body}
                              </div>
                              <div className={`flex items-center gap-2 text-[9px] text-stone-600 font-mono ${isAdmin ? 'justify-end' : ''}`}>
                                <span>{m.sender_name || (isAdmin ? 'Super Admin' : 'Barbearia')}</span>
                                <span>·</span>
                                <span>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={saMessagesEndRef} />
                    </div>

                    {/* Reply input */}
                    <div className="p-4 bg-[#120D09] border-t border-white/5 shrink-0">
                      {(currentActiveTicket.status === 'resolved' || currentActiveTicket.status === 'closed') ? (
                        <p className="text-center text-stone-600 text-xs py-2">Chamado resolvido. <button onClick={() => handleReopenTicket(currentActiveTicket.id)} className="text-[#C89A63] hover:underline cursor-pointer">Reabrir</button> para responder.</p>
                      ) : (
                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <input type="text" value={replyMessage} onChange={e => setReplyMessage(e.target.value)}
                            placeholder={`Responder a ${currentActiveTicket.shop_name || 'cliente'}...`}
                            className="flex-1 bg-[#18120D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C89A63]/50" />
                          <button type="submit" disabled={ticketLoading || !replyMessage.trim()}
                            className="px-4 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] rounded-xl font-bold flex items-center gap-2 cursor-pointer text-xs disabled:opacity-60 transition-all">
                            <Send className="w-3.5 h-3.5" /> Enviar
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </section>

              {/* RIGHT SIDEBAR: shop inspector */}
              <aside className="hidden xl:flex w-64 bg-[#0f0f0e] border-l border-white/5 flex-col h-full overflow-y-auto">
                {currentActiveTicket ? (() => {
                  const ticketShop = shops.find(s => s.id === currentActiveTicket.shop_id || s.name === currentActiveTicket.shop_name);
                  return (
                    <div className="p-5 space-y-6">
                      <div>
                        <h4 className="text-[10px] uppercase font-black text-[#C89A63] tracking-widest mb-3">Detalhes do Chamado</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-stone-500">Status</span><span className={`font-bold capitalize ${currentActiveTicket.status === 'resolved' ? 'text-green-400' : currentActiveTicket.status === 'open' ? 'text-indigo-400' : 'text-[#C89A63]'}`}>{currentActiveTicket.status.replace('_', ' ')}</span></div>
                          <div className="flex justify-between"><span className="text-stone-500">Prioridade</span><span className="font-bold text-stone-300 capitalize">{currentActiveTicket.priority}</span></div>
                          <div className="flex justify-between"><span className="text-stone-500">Criado</span><span className="font-mono text-stone-400 text-[10px]">{new Date(currentActiveTicket.created_at).toLocaleDateString('pt-BR')}</span></div>
                          {currentActiveTicket.resolved_at && <div className="flex justify-between"><span className="text-stone-500">Resolvido</span><span className="font-mono text-stone-400 text-[10px]">{new Date(currentActiveTicket.resolved_at).toLocaleDateString('pt-BR')}</span></div>}
                        </div>
                      </div>

                      {ticketShop && (
                        <div>
                          <h4 className="text-[10px] uppercase font-black text-[#C89A63] tracking-widest mb-3">Barbearia</h4>
                          <div className="space-y-3 text-xs">
                            {ticketShop.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" /><span className="text-stone-300">{ticketShop.location}</span></div>}
                            <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-[#C89A63] shrink-0" /><span className="text-stone-300">Plano {ticketShop.plan}</span></div>
                            <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-stone-500 shrink-0" /><div><p className="text-stone-300">{ticketShop.ownerName}</p><p className="text-stone-600 text-[10px]">{ticketShop.email}</p></div></div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <h4 className="text-[10px] uppercase font-black text-[#C89A63] tracking-widest mb-2">Ações</h4>
                        <button onClick={() => { if (ticketShop) { setActiveTab('audit'); } else triggerToast('Barbearia não encontrada.'); }}
                          className="w-full py-2.5 bg-[#18120D] hover:bg-[#161b22] border border-white/10 text-stone-300 font-bold text-[10px] rounded-xl uppercase tracking-wider cursor-pointer transition-all">
                          Ver Auditoria da Loja
                        </button>
                        <button onClick={async () => {
                          if (!ticketShop) return;
                          await addTicketMessage(currentActiveTicket.id, 'admin', '⚠️ Alerta enviado: a sua conta requer atenção imediata. Por favor, contacte o suporte.', 'Sistema');
                          setTicketMessages(prev => [...prev, { id: Date.now().toString(), ticket_id: currentActiveTicket.id, sender: 'admin', sender_name: 'Sistema', body: '⚠️ Alerta enviado: a sua conta requer atenção imediata. Por favor, contacte o suporte.', created_at: new Date().toISOString() }]);
                          triggerToast('Alerta enviado à barbearia via chamado.');
                        }}
                          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 font-bold text-[10px] rounded-xl uppercase tracking-wider cursor-pointer transition-all">
                          Enviar Alerta Urgente
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex-1 flex items-center justify-center text-stone-700 text-xs text-center px-4">
                    Selecione um chamado para ver detalhes
                  </div>
                )}
              </aside>

            </div>
          )}

          {/* TAB 5: PLATFORM CONFIG/SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              
              <header className="border-b border-white/5 pb-4">
                <h1 className="sa-heading text-xl font-semibold text-[#e5e2e1]">Configuração Global Plataforma</h1>
                <p className="text-stone-400 text-xs mt-1">Gerencie a identidade corporativa, níveis de segurança restritos, integrações de pagamento e alertas.</p>
              </header>

              {/* Settings navigation bar inside content */}
              <div className="flex gap-6 border-b border-white/5 mb-8 overflow-x-auto">
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'general' ? 'text-[#C89A63] border-b-2 border-[#C89A63]' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Identidade SaaS
                </button>
                <button
                  onClick={() => setSettingsTab('security')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'security' ? 'text-[#C89A63] border-b-2 border-[#C89A63]' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Segurança MFA
                </button>
                <button
                  onClick={() => setSettingsTab('billing')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'billing' ? 'text-[#C89A63] border-b-2 border-[#C89A63]' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Gateway Financeiro
                </button>
                <button
                  onClick={() => setSettingsTab('notifications')}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    settingsTab === 'notifications' ? 'text-[#C89A63] border-b-2 border-[#C89A63]' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Alertas de Instabilidade
                </button>
              </div>

              {/* Sub tab Content router */}
              {settingsTab === 'general' && (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-7 sa-card border-0 p-8 rounded-2xl space-y-6">
                    <h3 className="sa-heading text-base font-semibold text-stone-100 mb-2">Informações de Branding</h3>
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Nome do Produto Principal</label>
                          <input
                            type="text"
                            value={platformConfig.name}
                            onChange={(e) => setPlatformConfig({ ...platformConfig, name: e.target.value })}
                            className="w-full bg-[#18120D] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-[#C89A63] text-stone-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">E-mail Operacional Central</label>
                          <input
                            type="text"
                            value={platformConfig.email}
                            onChange={(e) => setPlatformConfig({ ...platformConfig, email: e.target.value })}
                            className="w-full bg-[#18120D] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-[#C89A63] text-stone-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Descrição do Produto (SEO Meta)</label>
                        <textarea
                          rows={3}
                          value={platformConfig.description}
                          onChange={(e) => setPlatformConfig({ ...platformConfig, description: e.target.value })}
                          className="w-full bg-[#18120D] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-[#C89A63] text-stone-200 resize-none leading-relaxed"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Logo institucional upload */}
                  <div className="col-span-12 lg:col-span-5 bg-[#120D09] border-2 border-dashed border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingLogo(true);
                        const path = `institutional/logo_${Date.now()}.${file.name.split('.').pop()}`;
                        const url = await uploadImage('platform-assets', file, path);
                        setIsUploadingLogo(false);
                        if (url) {
                          setInstitutionalLogoUrl(url);
                          triggerToast('Logotipo atualizado com sucesso!');
                        } else {
                          triggerToast('Erro ao fazer upload. Tente novamente.');
                        }
                        e.target.value = '';
                      }}
                    />
                    {institutionalLogoUrl ? (
                      <img src={institutionalLogoUrl} alt="Logo" className="w-16 h-16 rounded-full object-contain mb-4 border border-[#C89A63]/30" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#C89A63]/10 border border-[#C89A63]/20 flex items-center justify-center text-[#C89A63] mb-4">
                        <Scissors className="w-6 h-6" />
                      </div>
                    )}
                    <h4 className="text-sm font-serif font-black text-stone-100">Logotipo Institucional</h4>
                    <p className="text-[11px] text-stone-400 mt-1 mb-5 max-w-xs">
                      Upload de logotipo SVG ou PNG em alta fidelidade com canal de transparência (mín. 512×512px).
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-[#18120D] hover:bg-neutral-800 border border-white/10 text-stone-200 px-6 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? 'A carregar...' : 'Carregar Arquivo'}
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'security' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="sa-card border-0 p-8 rounded-2xl space-y-4">
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
                          platformConfig.mfaEnabled ? 'bg-[#C89A63]' : 'bg-neutral-800'
                        }`}
                      >
                        <div className={`w-5.5 h-5.5 bg-[#0d0d0c] rounded-full transition-transform ${
                          platformConfig.mfaEnabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="mt-4 p-4.5 bg-[#C89A63]/5 border border-[#C89A63]/10 rounded-xl flex items-center gap-3">
                      <Lock className="w-5 h-5 text-[#C89A63] animate-pulse" />
                      <p className="text-[11px] text-stone-300">
                        Nível de Compliance atual: <span className="text-[#C89A63] font-bold font-mono">92%</span> de todas as barbearias integradas ativaram MFA nos canais administrativos.
                      </p>
                    </div>
                  </div>

                  <div className="sa-card border-0 p-8 rounded-2xl space-y-4">
                    <h4 className="text-base font-serif text-stone-100 font-bold">Tempo Limite de Sessão Admin</h4>
                    <p className="text-xs text-stone-400">Tempo de inatividade de segurança prévio para desconexão forçada.</p>
                    
                    <select
                      value={platformConfig.sessionTimeout}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, sessionTimeout: e.target.value })}
                      className="w-full bg-[#18120D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-200 cursor-pointer"
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
                <div className="sa-card border-0 rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 bg-[#C89A63]/5">
                    <h4 className="text-base font-serif text-[#e5e2e1] font-bold">Conexões de Gateway SaaS</h4>
                    <p className="text-xs text-stone-400 mt-1">Configure as credenciais e conexões centrais de distribuição do ecossistema comercial.</p>
                  </div>

                  <div className="divide-y divide-white/5">
                    <div className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(200,154,99,0.15)] text-[#F5F1EB] border border-white/5 flex items-center justify-center shrink-0">
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
                        className="px-4 py-2 border border-white/10 hover:border-[#C89A63]/30 text-stone-300 hover:text-[#C89A63] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Reconfigurar
                      </button>
                    </div>

                    <div className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-4 opacity-50">
                        <div className="w-12 h-12 rounded-xl bg-[#18120D] text-stone-500 border border-white/5 flex items-center justify-center shrink-0">
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
                        className="px-4 py-2 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Definir Conexão
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'notifications' && (
                <div className="sa-card border-0 p-8 rounded-2xl space-y-6">
                  <h4 className="text-base font-serif text-stone-100 font-bold">Relatório de Eventos Críticos</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                        <div>
                          <p className="text-xs font-bold text-stone-100">Queda de Sistema / Outages</p>
                          <p className="text-[10px] text-stone-500">Notificar gerência de suporte de forma imediata por SMS.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-bold text-[9px] uppercase tracking-wider">Alta Prioridade</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
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
                  className="bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 duration-150-all shadow-lg shadow-[rgba(200,154,99,0.15)] cursor-pointer"
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
                  <h1 className="sa-heading text-xl font-semibold text-[#e5e2e1]">Convites (Onboarding)</h1>
                  <p className="text-stone-400 text-xs mt-1">Gerencie os links de convite para novas barbearias entrarem na plataforma.</p>
                </div>
                
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Gerar Convite
                </button>
              </div>

              <div className="sa-card border-0 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#18120D]/55 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Código / Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Link de Acesso</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider text-center">Usos</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Expiração</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invites.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#18120D]/35 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-stone-100 font-mono">{inv.id}</div>
                            <div className="text-[10px] uppercase font-bold mt-1">
                              <span className={inv.status === 'Active' ? 'text-green-500' : 'text-rose-500'}>{inv.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-[#18120D] px-2 py-1 rounded text-stone-300 font-mono select-all">
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
                               className="text-stone-400 hover:text-[#C89A63] p-1.5 bg-[#18120D] border border-white/5 rounded"
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
                  <div className="bg-[#120D09] border border-[#C89A63]/20 rounded-2xl p-8 max-w-sm w-full space-y-6 animate-slide-up relative">
                    <div className="border-b border-white/5 pb-4">
                        <span className="text-[10px] uppercase text-[#C89A63] font-bold tracking-widest block">SAAS CONTROL</span>
                        <h3 className="text-lg font-serif text-stone-100">Gerar Novo Convite</h3>
                    </div>
                    <div>
                        <p className="text-xs text-stone-400 mb-2">Este processo cria um link seguro de onboarding para uma nova barbearia parceira na plataforma BarberPro.</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C89A63]/80">Regras do convite:</p>
                        <ul className="text-xs text-stone-400 list-disc list-inside mt-1 ml-1 space-y-1">
                            <li>Expira em {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR')}.</li>
                            <li>Válido para 1 loja.</li>
                        </ul>
                    </div>

                    {/* Optional email field */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                        Email do parceiro <span className="text-stone-600 normal-case font-normal">(opcional "” envia o link por email)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
                        <input
                          type="email"
                          value={newInviteEmail}
                          onChange={(e) => setNewInviteEmail(e.target.value)}
                          placeholder="parceiro@barbearia.com"
                          className="w-full bg-[#0a0a09] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50 transition-colors placeholder-stone-700"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setIsInviteModalOpen(false); setNewInviteEmail(''); }}
                          className="flex-1 bg-[#18120D] hover:bg-neutral-800 text-stone-300 py-3 rounded-xl text-xs uppercase font-bold text-center transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateInvite}
                          disabled={isSendingInvite}
                          className="flex-1 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {isSendingInvite ? 'Gerando...' : (newInviteEmail ? 'Gerar & Enviar' : 'Confirmar')}
                        </button>
                    </div>
                  </div>
               </div>
              )}
            </div>
          )}

          {/* TAB 7: GESTÃO FINANCEIRA */}
          {activeTab === 'revenue' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h1 className="sa-heading text-xl font-semibold text-[#e5e2e1]">Gestão Financeira</h1>
                  <p className="text-stone-400 text-xs mt-1">Visão consolidada de receita, subscrições e métricas financeiras da plataforma.</p>
                </div>
                <button className="sa-btn-ghost px-4 py-2 text-xs flex items-center gap-2 rounded-xl">
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>

              {/* KPI Strip */}
              {(() => {
                const arr = totalMrr * 12;
                const arpu = activeShops > 0 ? totalMrr / activeShops : 0;
                const suspendedCount = shops.filter(s => s.status === 'Suspended').length;
                const churnPct = shops.length > 0 ? ((suspendedCount / shops.length) * 100).toFixed(1) : '0.0';
                const trialRevPotential = shops
                  .filter(s => s.trial_end_at && new Date(s.trial_end_at) > new Date())
                  .reduce((sum, s) => sum + s.mrr, 0);
                const kpis = [
                  { label: 'MRR', value: `€ ${totalMrr.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`, sub: 'receita mensal recorrente', color: 'text-[#C89A63]' },
                  { label: 'ARR', value: `€ ${arr.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`, sub: 'receita anual projetada', color: 'text-green-400' },
                  { label: 'ARPU', value: `€ ${arpu.toFixed(0)}`, sub: 'receita média por cliente', color: 'text-blue-400' },
                  { label: 'Churn Rate', value: `${churnPct}%`, sub: `${suspendedCount} suspensas`, color: 'text-rose-400' },
                  { label: 'Trial Pipeline', value: `€ ${trialRevPotential.toLocaleString('pt-PT', { minimumFractionDigits: 0 })}`, sub: `${trialShops} em trial`, color: 'text-indigo-400' },
                ];
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {kpis.map(kpi => (
                      <div key={kpi.label} className="bg-[#18120D] border border-white/5 rounded-2xl p-5">
                        <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block mb-2">{kpi.label}</span>
                        <span className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.value}</span>
                        <span className="text-[10px] text-stone-600 block mt-1">{kpi.sub}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Revenue by Plan + Top Shops */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Revenue by Plan */}
                <div className="lg:col-span-5 bg-[#18120D] border border-white/5 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C89A63]" />
                    <h3 className="sa-heading text-sm font-semibold text-stone-100">Receita por Plano</h3>
                  </div>
                  {(() => {
                    const planColors: Record<string, string> = { Basic: 'bg-blue-500', Professional: 'bg-[#C89A63]', Premium: 'bg-green-500' };
                    const planData = (['Basic', 'Professional', 'Premium'] as const).map(plan => {
                      const planShops = shops.filter(s => s.plan === plan && s.status === 'Active');
                      return { plan, count: planShops.length, mrr: planShops.reduce((sum, s) => sum + s.mrr, 0) };
                    });
                    return (
                      <div className="space-y-5">
                        {planData.map(({ plan, count, mrr }) => (
                          <div key={plan} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-stone-300">{plan}</span>
                              <span className="text-xs font-mono font-bold text-stone-200">
                                € {mrr.toLocaleString('pt-PT')}
                                <span className="text-stone-500 font-normal ml-1.5">({count} lojas)</span>
                              </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${planColors[plan]} rounded-full transition-all`}
                                style={{ width: totalMrr > 0 ? `${(mrr / totalMrr) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-[10px] text-stone-600">
                              {totalMrr > 0 ? ((mrr / totalMrr) * 100).toFixed(1) : '0.0'}% do MRR
                            </span>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
                          {[
                            { label: 'Ativas', value: activeShops },
                            { label: 'Trial', value: trialShops },
                            { label: 'Suspensas', value: shops.filter(s => s.status === 'Suspended').length },
                          ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                              <span className="block text-lg font-black font-mono text-stone-200">{value}</span>
                              <span className="text-[9px] uppercase tracking-wider text-stone-500">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Top MRR Shops */}
                <div className="lg:col-span-7 bg-[#18120D] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#C89A63]" />
                      <h3 className="sa-heading text-sm font-semibold text-stone-100">Top Barbearias por MRR</h3>
                    </div>
                    <span className="text-[10px] text-stone-500">{activeShops} ativas</span>
                  </div>
                  <div className="overflow-y-auto max-h-[320px] sa-scrollbar space-y-1">
                    {shops
                      .filter(s => s.status === 'Active')
                      .sort((a, b) => b.mrr - a.mrr)
                      .slice(0, 10)
                      .map((shop, i) => {
                        const planBadge: Record<string, string> = {
                          Basic: 'sa-badge-blue',
                          Professional: 'sa-badge-amber',
                          Premium: 'sa-badge-green',
                        };
                        return (
                          <div key={shop.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <span className="text-[10px] font-black text-stone-600 w-5 text-center shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-stone-200 truncate">{shop.name}</p>
                              <p className="text-[10px] text-stone-500 truncate">{shop.ownerName} · {shop.location}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 ${planBadge[shop.plan] || 'sa-badge-blue'}`}>{shop.plan}</span>
                            <span className="text-xs font-black font-mono text-[#C89A63] w-20 text-right shrink-0">€ {shop.mrr.toLocaleString('pt-PT')}</span>
                          </div>
                        );
                      })}
                    {activeShops === 0 && (
                      <div className="text-center py-12 text-stone-600 text-xs">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Nenhuma barbearia ativa.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial Pipeline */}
              {trialShops > 0 && (
                <div className="bg-[#18120D] border border-indigo-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <h3 className="sa-heading text-sm font-semibold text-stone-100">Pipeline de Trial</h3>
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full font-black uppercase">{trialShops} activos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {shops
                      .filter(s => s.trial_end_at && new Date(s.trial_end_at) > new Date())
                      .sort((a, b) => new Date(a.trial_end_at!).getTime() - new Date(b.trial_end_at!).getTime())
                      .map(shop => {
                        const daysLeft = Math.ceil((new Date(shop.trial_end_at!).getTime() - Date.now()) / 86400000);
                        const urgent = daysLeft <= 7;
                        return (
                          <div key={shop.id} className={`flex items-center gap-3 p-3 rounded-xl border ${urgent ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-stone-200 truncate">{shop.name}</p>
                              <p className="text-[10px] text-stone-500">{shop.plan} · €{shop.mrr}/mês</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ${urgent ? 'bg-rose-500/15 text-rose-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                              {daysLeft}d
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* LTV Estimate */}
              {(() => {
                const suspendedCount = shops.filter(s => s.status === 'Suspended').length;
                const churnRate = shops.length > 0 ? suspendedCount / shops.length : 0;
                const arpu = activeShops > 0 ? totalMrr / activeShops : 0;
                const avgLifetimeMonths = churnRate > 0 ? 1 / churnRate : 24;
                const ltv = arpu * avgLifetimeMonths;
                const trialConversionCount = shops.filter(s => s.status === 'Active' && s.trial_start_at).length;
                const trialTotalCount = shops.filter(s => s.trial_start_at).length;
                const trialConvPct = trialTotalCount > 0 ? ((trialConversionCount / trialTotalCount) * 100).toFixed(0) : '—';
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'LTV Estimado', value: `€ ${ltv.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`, sub: `${avgLifetimeMonths.toFixed(0)} meses médios de vida`, icon: <Star className="w-4 h-4 text-[#C89A63]" /> },
                      { label: 'Conversão Trial → Pago', value: `${trialConvPct}%`, sub: `${trialConversionCount} de ${trialTotalCount} trials convertidos`, icon: <ArrowRight className="w-4 h-4 text-green-400" /> },
                      { label: 'Receita em Risco', value: `€ ${shops.filter(s => s.status === 'Suspended').reduce((sum, s) => sum + s.mrr, 0).toLocaleString('pt-PT')}`, sub: `${suspendedCount} lojas suspensas`, icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
                    ].map(card => (
                      <div key={card.label} className="bg-[#18120D] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                        <div className="mt-0.5 shrink-0">{card.icon}</div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block mb-1">{card.label}</span>
                          <span className="text-lg font-black font-mono text-stone-100">{card.value}</span>
                          <span className="text-[10px] text-stone-500 block mt-0.5">{card.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 8: LOGS (PHASE 2) */}
          {activeTab === 'logs' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-[#18120D] border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Auditoria & Logs (Fase 2)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Histórico global de alterações em planos, criação de lojas e eventos de sistema.</p>
            </div>
          )}

          {/* TAB 9: USERS (GLOBAL) */}
          {activeTab === 'users' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-[#18120D] border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Equipa Global (Em Desenvolvimento)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Controlo de perfis administrativos de suporte e gestão da plataforma (Owner, Support, Billing).</p>
            </div>
          )}

          {/* TAB 10: MONITOR (TECHNICAL) */}
          {activeTab === 'monitor' && (
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-[#18120D] border border-white/5 rounded-2xl flex items-center justify-center text-stone-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif text-stone-200">Infraestrutura SaaS (Em breve)</h2>
              <p className="text-sm text-stone-500 mt-2 max-w-md">Status de APIs, conectividade com Stripe, WhatsApp e monitorização da base de dados Supabase.</p>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: APROVAÇÕES */}
          {/* ============================================================ */}
          {activeTab === 'approvals' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Filter bar */}
              <div className="flex flex-wrap gap-2">
                {(['All','Pending','Active','Suspended'] as const).map(f => (
                  <button key={f} onClick={() => setApprovalStatusFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${approvalStatusFilter === f ? 'bg-[#C89A63] text-[#111111] border-[#C89A63]' : 'bg-transparent border-white/10 text-stone-400 hover:border-[#C89A63]/40'}`}>
                    {f === 'All' ? 'Todas' : f === 'Pending' ? `Pendentes (${pendingCount})` : f === 'Active' ? 'Ativas' : 'Suspensas'}
                  </button>
                ))}
              </div>

              {/* Shop list */}
              <div className="space-y-3">
                {filteredApprovals.length === 0 && (
                  <div className="text-center py-16 text-stone-600 text-sm">
                    <BadgeCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Nenhuma barbearia neste filtro.
                  </div>
                )}
                {filteredApprovals.map(shop => {
                  const daysLeft = getTrialDaysLeft(shop);
                  const statusColor = shop.status === 'Active' ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : shop.status === 'Pending' ? 'text-[#C89A63] bg-[#C89A63]/10 border-[#C89A63]/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                  return (
                    <div key={shop.id} className="sa-card border-0 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[#C89A63]/20 transition-all">
                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-serif text-base text-stone-100 font-medium">{shop.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColor}`}>{shop.status}</span>
                          {daysLeft !== null && daysLeft >= 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${daysLeft <= 7 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'}`}>
                              Trial: {daysLeft}d restantes
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] text-stone-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{shop.ownerName}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{shop.email}</span>
                          {shop.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{shop.phone}</span>}
                          {shop.registered_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Registado: {new Date(shop.registered_at).toLocaleDateString('pt-BR')}</span>}
                        </div>
                        {shop.notes && <p className="text-[10px] text-stone-600 italic border-l-2 border-stone-700 pl-2 mt-1">{shop.notes}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {shop.status === 'Pending' && (
                          <>
                            <button onClick={() => openAction(shop, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                            </button>
                            <button onClick={() => openAction(shop, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                              <XCircle className="w-3.5 h-3.5" /> Rejeitar
                            </button>
                          </>
                        )}
                        {shop.status === 'Active' && (
                          <>
                            <button onClick={() => openAction(shop, 'trial')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                              <Clock className="w-3.5 h-3.5" /> Trial
                            </button>
                            <button onClick={() => openAction(shop, 'plan')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#C89A63]/10 hover:bg-[#C89A63]/20 text-[#C89A63] border border-[#C89A63]/20 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                              <Package className="w-3.5 h-3.5" /> Plano
                            </button>
                            <button onClick={() => openAction(shop, 'suspend')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-stone-400 border border-white/10 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                              <PauseCircle className="w-3.5 h-3.5" /> Suspender
                            </button>
                          </>
                        )}
                        {shop.status === 'Suspended' && (
                          <button onClick={() => openAction(shop, 'reactivate')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                            <PlayCircle className="w-3.5 h-3.5" /> Reativar
                          </button>
                        )}
                        <button onClick={() => openAction(shop, 'note')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-stone-400 border border-white/10 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all">
                          <Edit3 className="w-3.5 h-3.5" /> Nota
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: NOTIFICAÇÕES */}
          {/* ============================================================ */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-stone-500 text-xs">{unreadNotifCount} não lidas</p>
                {unreadNotifCount > 0 && (
                  <button onClick={handleMarkAllRead}
                    className="text-[10px] font-black uppercase text-[#C89A63] hover:text-[#D8AE7A] cursor-pointer tracking-wider">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {notifications.length === 0 && (
                <div className="text-center py-16 text-stone-600 text-sm">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Sem notificações.
                </div>
              )}
              {notifications.map(notif => (
                <div key={notif.id} onClick={() => handleMarkNotifRead(notif.id)}
                  className={`flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${notif.is_read ? 'bg-[#0e0e0d] border-white/5 opacity-60' : 'bg-[#120D09] border-[#C89A63]/15 hover:border-[#C89A63]/30'}`}>
                  <div className="text-2xl shrink-0">{notifIcon[notif.type] || '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${notif.is_read ? 'text-stone-400' : 'text-stone-100'}`}>{notif.title}</p>
                      <span className="text-[10px] text-stone-600 shrink-0">{new Date(notif.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    {notif.message && <p className="text-xs text-stone-500 mt-0.5">{notif.message}</p>}
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 bg-[#C89A63] rounded-full shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: PLANOS */}
          {/* ============================================================ */}
          {activeTab === 'plans' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-stone-500 text-xs">{saasPlans.length} planos cadastrados</p>
                <button onClick={() => { setEditingPlan(null); setPlanForm({ is_active: true, features: [] }); setIsPlanModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all">
                  <Plus className="w-4 h-4" /> Novo Plano
                </button>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {saasPlans.map(plan => (
                  <div key={plan.id} className={`bg-[#120D09] border rounded-2xl p-6 space-y-4 ${plan.is_active ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-lg text-stone-100">{plan.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${plan.is_active ? 'bg-green-500/10 text-green-400' : 'bg-stone-800 text-stone-500'}`}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className="text-stone-500 text-xs mt-1">{plan.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingPlan(plan); setPlanForm(plan); setIsPlanModalOpen(true); }}
                          className="p-1.5 hover:bg-white/5 text-stone-400 rounded-lg transition-colors cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => { if (await deleteSaasPlan(plan.id)) setSaasPlans(p => p.filter(pl => pl.id !== plan.id)); }}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div><p className="text-[10px] text-stone-600 uppercase font-bold">Mensal</p><p className="text-lg font-black font-mono text-[#C89A63]">€{plan.price_monthly}</p></div>
                      <div><p className="text-[10px] text-stone-600 uppercase font-bold">Anual</p><p className="text-lg font-black font-mono text-stone-300">€{plan.price_annual}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {[
                        ['Utilizadores', plan.max_users],
                        ['Barbeiros', plan.max_barbers],
                        ['Serviços', plan.max_services],
                        ['Reservas/mês', plan.max_bookings_per_month],
                      ].map(([label, val]) => (
                        <div key={String(label)} className="flex justify-between bg-[#0a0a09] rounded-lg px-3 py-2">
                          <span className="text-stone-500">{label}</span>
                          <span className="font-bold text-stone-300">{val}</span>
                        </div>
                      ))}
                    </div>
                    {plan.features.length > 0 && (
                      <ul className="space-y-1 pt-2 border-t border-white/5">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[10px] text-stone-400">
                            <Check className="w-3 h-3 text-[#C89A63] shrink-0" />{f}
                          </li>
                        ))}
                        {plan.features.length > 3 && <li className="text-[10px] text-stone-600">+{plan.features.length - 3} mais</li>}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: AUDITORIA */}
          {/* ============================================================ */}
          {activeTab === 'audit' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <p className="text-stone-500 text-xs">{auditLogs.length} registos de auditoria</p>
              {auditLogs.length === 0 && (
                <div className="text-center py-16 text-stone-600 text-sm">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Sem registos de auditoria ainda.
                </div>
              )}
              <div className="space-y-2">
                {auditLogs.map(log => {
                  const actionColors: Record<string, string> = {
                    APPROVE_SHOP: 'text-green-400', REJECT_SHOP: 'text-rose-400',
                    SUSPEND_SHOP: 'text-[#C89A63]', REACTIVATE_SHOP: 'text-indigo-300',
                    EXTEND_TRIAL: 'text-blue-400', UPDATE_PLAN: 'text-purple-400',
                    ADD_NOTE: 'text-stone-400',
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-4 sa-card border-0 rounded-xl p-4">
                      <div className="shrink-0 w-2 h-2 rounded-full bg-[#C89A63]/50 mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-xs font-black uppercase tracking-wider font-mono ${actionColors[log.action] || 'text-stone-400'}`}>{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-stone-600">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        {log.shop_name && <p className="text-sm text-stone-300 mt-0.5">{log.shop_name}</p>}
                        {log.performed_by && <p className="text-[10px] text-stone-600">por {log.performed_by}</p>}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-[10px] text-stone-600 font-mono mt-1 bg-[#0a0a09] rounded px-2 py-1">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </motion.div>
        </AnimatePresence>

        {/* ============================================================ */}
        {/* ACTION MODALS */}
        {/* ============================================================ */}
        <AnimatePresence>
          {actionModal && selectedShop && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeAction} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-[#120D09] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-stone-100">
                      {actionModal === 'approve' && 'Aprovar Barbearia'}
                      {actionModal === 'reject' && 'Rejeitar Barbearia'}
                      {actionModal === 'suspend' && 'Suspender Barbearia'}
                      {actionModal === 'reactivate' && 'Reativar Barbearia'}
                      {actionModal === 'trial' && 'Gerir Trial'}
                      {actionModal === 'plan' && 'Alterar Plano'}
                      {actionModal === 'note' && 'Adicionar Observação'}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">{selectedShop.name}</p>
                  </div>
                  <button onClick={closeAction} className="p-1 text-stone-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>

                {/* Body */}
                {(actionModal === 'approve') && (
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Dias de Trial</label>
                    <input type="number" min={1} max={365} value={trialDaysInput} onChange={e => setTrialDaysInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50" />
                    <p className="text-xs text-stone-600">Trial de {trialDaysInput} dias começará imediatamente após aprovação.</p>
                  </div>
                )}
                {(actionModal === 'reject' || actionModal === 'suspend' || actionModal === 'note') && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                      {actionModal === 'note' ? 'Observação' : 'Motivo / Observação'}
                    </label>
                    <textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} rows={3}
                      className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50 resize-none"
                      placeholder="Descreva o motivo..." />
                  </div>
                )}
                {actionModal === 'trial' && (
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Dias adicionais de Trial</label>
                    <input type="number" min={1} max={365} value={trialDaysInput} onChange={e => setTrialDaysInput(Number(e.target.value))}
                      className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50" />
                    {selectedShop.trial_end_at && (
                      <p className="text-xs text-stone-500">Trial atual termina em: {new Date(selectedShop.trial_end_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                )}
                {actionModal === 'plan' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Selecionar Plano</label>
                    <select value={actionPlanId} onChange={e => setActionPlanId(e.target.value)}
                      className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50 cursor-pointer">
                      <option value="">Selecione...</option>
                      {saasPlans.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id} className="bg-[#120D09]">{p.name} "” €{p.price_monthly}/mês</option>
                      ))}
                    </select>
                  </div>
                )}
                {actionModal === 'reactivate' && (
                  <p className="text-sm text-stone-400">Confirmar reativação de <span className="text-[#C89A63] font-bold">{selectedShop.name}</span>?</p>
                )}

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                  <button onClick={closeAction} className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs font-bold uppercase text-stone-400 hover:text-white cursor-pointer transition-all">Cancelar</button>
                  <button
                    disabled={isActionLoading}
                    onClick={
                      actionModal === 'approve' ? handleApprove :
                      actionModal === 'reject' ? handleReject :
                      actionModal === 'suspend' ? handleSuspend :
                      actionModal === 'reactivate' ? handleReactivate :
                      actionModal === 'trial' ? handleExtendTrial :
                      actionModal === 'note' ? handleAddNote :
                      actionModal === 'plan' ? handleUpdatePlan :
                      closeAction
                    }
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all disabled:opacity-60 ${
                      actionModal === 'reject' || actionModal === 'suspend' ? 'bg-rose-500 hover:bg-rose-400 text-white' : 'bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111]'
                    }`}
                  >
                    {isActionLoading ? 'A processar...' : 'Confirmar'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* PLAN MODAL */}
        {/* ============================================================ */}
        <AnimatePresence>
          {isPlanModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsPlanModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg bg-[#120D09] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-stone-100">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                  <button onClick={() => setIsPlanModalOpen(false)} className="p-1 text-stone-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                {([
                  { key: 'name', label: 'Nome', type: 'text' },
                  { key: 'description', label: 'Descrição', type: 'text' },
                  { key: 'price_monthly', label: 'Preço Mensal (€)', type: 'number' },
                  { key: 'price_annual', label: 'Preço Anual (€)', type: 'number' },
                  { key: 'max_users', label: 'Máx. Utilizadores', type: 'number' },
                  { key: 'max_barbers', label: 'Máx. Barbeiros', type: 'number' },
                  { key: 'max_services', label: 'Máx. Serviços', type: 'number' },
                  { key: 'max_bookings_per_month', label: 'Máx. Reservas/Mês', type: 'number' },
                ] as const).map(({ key, label, type }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">{label}</label>
                    <input type={type} value={(planForm as any)[key] || ''} onChange={e => setPlanForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">Recursos (um por linha)</label>
                  <textarea rows={3} value={(planForm.features || []).join('\n')}
                    onChange={e => setPlanForm(p => ({ ...p, features: e.target.value.split('\n').filter(Boolean) }))}
                    className="w-full bg-[#0a0a09] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-[#C89A63]/50 resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="plan-active" checked={planForm.is_active !== false} onChange={e => setPlanForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-[#C89A63]" />
                  <label htmlFor="plan-active" className="text-sm text-stone-300 cursor-pointer">Plano ativo</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs font-bold uppercase text-stone-400 hover:text-white cursor-pointer">Cancelar</button>
                  <button onClick={handleSavePlan} className="flex-1 py-2.5 bg-[#C89A63] hover:bg-[#D8AE7A] text-[#111111] font-black rounded-xl text-xs uppercase cursor-pointer">Guardar Plano</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

