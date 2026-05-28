'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { saveRow, deleteRow } from '../lib/supabase-service';
import {
  Calendar,
  Trash2,
  Check,
  Plus,
  Search,
  Users,
  Award,
  TrendingUp,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  Package,
  Scissors,
  Smile,
  Wallet,
  Settings,
  Sparkles,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  FileText
} from 'lucide-react';

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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  sales: number;
  spent: number;
  lastVisit: string;
  loyaltyPoints: number;
}

interface StockItem {
  id: string;
  name: string;
  status: 'Estoque baixo' | 'Estoque crítico' | 'Estoque normal';
  quantity: number;
  category: 'inventory' | 'soap' | 'warning';
}

interface CashTransaction {
  id: string;
  type: 'faturamento' | 'despesas';
  amount: number;
  description: string;
  date: string;
  category?: string;
}

// 1. AGENDA VIEW (Grelha Diária)
export function AgendaView({
  selectedAgendaDate,
  setSelectedAgendaDate,
  barbers,
  appointments,
  handleCompleteAppt,
  handleUpdateAppointmentStatus,
  setBookingFormData,
  setIsSchedulingsOpen,
  triggerToast,
  setAuditLogs
}: {
  selectedAgendaDate: string;
  setSelectedAgendaDate: (d: string) => void;
  barbers: Barber[];
  appointments: Appointment[];
  handleCompleteAppt: (id: string) => void;
  handleUpdateAppointmentStatus: (id: string, stat: any) => void;
  setBookingFormData: React.Dispatch<React.SetStateAction<any>>;
  setIsSchedulingsOpen: (o: boolean) => void;
  triggerToast: (msg: string) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const hourlySlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Agenda Diária Integrada
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Planejamento de horários por barbeiro especialista. Selecione slots vazios para agendar atendimentos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-semibold font-mono shrink-0">DATA:</span>
          <input
            type="date"
            value={selectedAgendaDate}
            onChange={(e) => {
              setSelectedAgendaDate(e.target.value);
              setAuditLogs((p) => [`[INFO] ${new Date().toLocaleTimeString()} - Filtro de data alterado para ${e.target.value}`, ...p]);
            }}
            className="bg-surface-container-high border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {barbers.map((barb, bIdx) => {
          return (
            <div key={barb.id} className="glass-card p-5 rounded-2xl flex flex-col border border-white/5 hover:border-primary/10 transition-colors">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4 text-left">
                <div className="w-12 h-12 rounded-full border border-primary/20 relative shrink-0">
                  <Image
                    className="object-cover rounded-full"
                    alt={barb.name}
                    src={barb.avatarUrl}
                    fill
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-on-surface truncate">{barb.name}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-tight truncate">{barb.specialty}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] bg-primary/25 text-primary font-bold px-1.5 py-0.5 rounded">⭐ {barb.rating}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${barb.status === 'Livre' ? 'bg-green-500' : barb.status === 'Atendendo' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-[8px] text-on-surface-variant font-mono uppercase font-bold">{barb.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {hourlySlots.map((hour) => {
                  const appt = appointments.find(
                    (a) =>
                      a.time.startsWith(hour.slice(0, 3)) &&
                      (a.barberId === barb.id || (!a.barberId && parseInt(a.id.replace(/\D/g, '')) % barbers.length === bIdx))
                  );

                  if (appt) {
                    return (
                      <div
                        key={hour}
                        className="p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left flex flex-col gap-1.5 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary font-mono">{hour} • Ocupado</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${appt.status === 'Concluído' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface truncate">{appt.clientName}</p>
                          <p className="text-[9px] text-on-surface-variant truncate">{appt.serviceName}</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <span className="text-[10px] font-bold text-primary font-mono">€ {appt.price.toFixed(2)}</span>
                          <div className="flex gap-1.5">
                            {appt.status !== 'Concluído' && appt.status !== 'Cancelado' && (
                              <button
                                onClick={() => {
                                  handleCompleteAppt(appt.id);
                                  setAuditLogs((p) => [`[JOB] ${new Date().toLocaleTimeString()} - Atendimento de ${appt.clientName} concluído.`, ...p]);
                                }}
                                className="p-1 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                                title="Marcar Concluído"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {appt.status !== 'Cancelado' && (
                              <button
                                onClick={() => {
                                  handleUpdateAppointmentStatus(appt.id, 'Cancelado');
                                  setAuditLogs((p) => [`[WARN] ${new Date().toLocaleTimeString()} - Atendimento de ${appt.clientName} cancelado.`, ...p]);
                                }}
                                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                title="Cancelar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={hour}
                      onClick={() => {
                        setBookingFormData((p: any) => ({ ...p, time: hour, barberId: barb.id, date: selectedAgendaDate }));
                        setIsSchedulingsOpen(true);
                        triggerToast(`Agendando livre com ${barb.name} às ${hour}`);
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-dashed border-white/10 hover:border-primary/40 hover:bg-white/[0.01] transition-all flex items-center justify-between text-on-surface-variant hover:text-primary cursor-pointer group"
                    >
                      <span className="text-[10px] font-semibold font-mono tracking-wide">{hour} • Livre</span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold flex items-center gap-0.5">
                        + Reservar
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. HISTÓRICO / AGENDAMENTOS VIEW
export function AgendamentosView({
  appointments,
  clientSearchFilter,
  setClientSearchFilter,
  activeStatusFilter,
  setActiveStatusFilter,
  handleCompleteAppt,
  handleUpdateAppointmentStatus,
  handleRemoveAppt,
  barbers,
  handleOpenBooking,
  triggerToast,
  setAuditLogs
}: {
  appointments: Appointment[];
  clientSearchFilter: string;
  setClientSearchFilter: (s: string) => void;
  activeStatusFilter: string;
  setActiveStatusFilter: (s: string) => void;
  handleCompleteAppt: (id: string) => void;
  handleUpdateAppointmentStatus: (id: string, s: any) => void;
  handleRemoveAppt: (id: string) => void;
  barbers: Barber[];
  handleOpenBooking: () => void;
  triggerToast: (m: string) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Central de Agendamentos
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Gerencie, inicie, finalize e filtre todos os atendimentos cadastrados na Barbearia.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase">Cadastrados</p>
            <p className="text-lg font-bold text-primary font-mono">{appointments.length}</p>
          </div>
          <button
            onClick={() => handleOpenBooking()}
            className="bg-primary hover:brightness-110 text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar por cliente ou serviço..."
            value={clientSearchFilter}
            onChange={(e) => setClientSearchFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Todos', 'Confirmado', 'Em andamento', 'Concluído', 'Cancelado'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatusFilter(status);
                triggerToast(`Mostrando reservas: "${status}"`);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeStatusFilter === status
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-on-surface-variant font-medium text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Cliente</th>
                <th className="px-6 py-4 text-left">Serviço</th>
                <th className="px-6 py-4 text-left">Preço</th>
                <th className="px-6 py-4 text-left">Horário</th>
                <th className="px-6 py-4 text-left">Profissional</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {appointments
                .filter((appt) => {
                  const matchesSearch =
                    appt.clientName.toLowerCase().includes(clientSearchFilter.toLowerCase()) ||
                    appt.serviceName.toLowerCase().includes(clientSearchFilter.toLowerCase());
                  const matchesFilter = activeStatusFilter === 'Todos' || appt.status === activeStatusFilter;
                  return matchesSearch && matchesFilter;
                })
                .map((appt) => {
                  const assignedBarber = barbers.find((b) => b.id === appt.barberId) || barbers[0];
                  return (
                    <tr key={appt.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative shrink-0">
                            <Image
                              className="object-cover rounded-full"
                              alt={appt.clientName}
                              src={appt.avatarUrl}
                              fill
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <p className="font-semibold text-on-surface text-xs">{appt.clientName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{appt.serviceName}</td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">€ {appt.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white/5 px-2 py-1 rounded font-mono font-semibold text-primary text-xs">
                          {appt.time}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{assignedBarber?.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            appt.status === 'Concluído'
                              ? 'bg-green-500/15 text-green-400'
                              : appt.status === 'Em andamento'
                              ? 'bg-amber-500/15 text-amber-400'
                              : appt.status === 'Cancelado'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-indigo-500/15 text-indigo-400'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {appt.status === 'Confirmado' && (
                            <button
                              onClick={() => {
                                handleUpdateAppointmentStatus(appt.id, 'Em andamento');
                                setAuditLogs((p) => [`[WORK] ${new Date().toLocaleTimeString()} - Atendimento de ${appt.clientName} iniciado.`, ...p]);
                              }}
                              className="px-2 py-1 text-[10px] bg-amber-500 text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                            >
                              Iniciar
                            </button>
                          )}
                          {appt.status === 'Em andamento' && (
                            <button
                              onClick={() => {
                                handleCompleteAppt(appt.id);
                                setAuditLogs((p) => [`[MONEY] ${new Date().toLocaleTimeString()} - Atendimento concluído de ${appt.clientName}.`, ...p]);
                              }}
                              className="px-2 py-1 text-[10px] bg-green-500 text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                            >
                              Concluir
                            </button>
                          )}
                          {appt.status !== 'Concluído' && appt.status !== 'Cancelado' && (
                            <button
                              onClick={() => {
                                handleUpdateAppointmentStatus(appt.id, 'Cancelado');
                                setAuditLogs((p) => [`[WARN] ${new Date().toLocaleTimeString()} - Agendamento cancelado - ${appt.clientName}`, ...p]);
                              }}
                              className="p-1 px-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleRemoveAppt(appt.id);
                              setAuditLogs((p) => [`[CRUD] ${new Date().toLocaleTimeString()} - Exclusão de agendamento: ${appt.clientName}`, ...p]);
                            }}
                            className="p-1.5 hover:bg-white/10 text-on-surface-variant hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    Nenhum agendamento encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3. CLIENTES VIEW (CRM Completo)
export function ClientesView({
  clients,
  setClients,
  clientSearchFilter,
  setClientSearchFilter,
  isClientFormExpanded,
  setIsClientFormExpanded,
  clientFormState,
  setClientFormState,
  setActiveClientsCount,
  setAuditLogs,
  triggerToast,
  averageTicket
}: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  clientSearchFilter: string;
  setClientSearchFilter: (s: string) => void;
  isClientFormExpanded: boolean;
  setIsClientFormExpanded: (b: boolean) => void;
  clientFormState: { name: string; email: string; phone: string };
  setClientFormState: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string }>>;
  setActiveClientsCount: React.Dispatch<React.SetStateAction<number>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
  averageTicket: number;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-2xl relative">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Clientes no CRM</p>
          <h4 className="text-3xl font-display font-bold text-primary mt-1">{clients.length}</h4>
          <div className="absolute right-4 bottom-4 p-2 bg-primary/10 rounded-full text-primary"><Users className="w-5 h-5" /></div>
        </div>
        <div className="glass-card p-5 rounded-2xl relative">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Ticket Médio / Cli</p>
          <h4 className="text-3xl font-display font-bold text-green-400 mt-1">€ {averageTicket.toFixed(2)}</h4>
          <div className="absolute right-4 bottom-4 p-2 bg-green-500/10 rounded-full text-green-400"><TrendingUp className="w-5 h-5" /></div>
        </div>
        <div className="glass-card p-5 rounded-2xl relative">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Clientes Premium</p>
          <h4 className="text-3xl font-display font-bold text-purple-400 mt-1">
            {clients.filter(c => c.loyaltyPoints > 200).length} Ativos
          </h4>
          <div className="absolute right-4 bottom-4 p-2 bg-purple-500/10 rounded-full text-purple-400"><Award className="w-5 h-5" /></div>
        </div>
        <button
          onClick={() => setIsClientFormExpanded(!isClientFormExpanded)}
          className="glass-card p-5 rounded-2xl hover:border-primary/50 hover:bg-white/[0.02] cursor-pointer flex flex-col items-center justify-center border border-dashed border-white/20 transition-all group"
        >
          <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-on-surface">Inscrever Cliente CRM</span>
        </button>
      </div>

      {isClientFormExpanded && (
        <div className="glass-card p-6 rounded-2xl border border-primary/30 space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
            REGISTRAR CLIENTE NO SISTEMA INTEGRADO
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!clientFormState.name.trim()) {
                triggerToast('Defina o nome do cliente!');
                return;
              }
              const newCli: Client = {
                id: `cli-${Date.now()}`,
                name: clientFormState.name,
                email: clientFormState.email || 'contato@generic.com',
                phone: clientFormState.phone || '(11) 98888-7777',
                sales: 0,
                spent: 0,
                lastVisit: 'Sem Visitas',
                loyaltyPoints: 0,
              };
              setClients((p) => [newCli, ...p]);
              saveRow('clients', newCli);
              setActiveClientsCount((p) => p + 1);
              setAuditLogs((p) => [`[CRM] ${new Date().toLocaleTimeString()} - Cliente inserido: ${clientFormState.name}`, ...p]);
              triggerToast(`Cliente ${clientFormState.name} cadastrado com sucesso!`);
              setClientFormState({ name: '', email: '', phone: '' });
              setIsClientFormExpanded(false);
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Nome Inteiro</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Augusto Silva"
                value={clientFormState.name}
                onChange={(e) => setClientFormState((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Email</label>
              <input
                type="email"
                placeholder="Ex: carlos@outlook.com"
                value={clientFormState.email}
                onChange={(e) => setClientFormState((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1 flex flex-col justify-between">
              <label className="text-[10px] text-primary uppercase font-bold">Celular / WhatsApp</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: (11) 98765-4321"
                  value={clientFormState.phone}
                  onChange={(e) => setClientFormState((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
                />
                <button
                  type="submit"
                  className="bg-primary hover:brightness-110 px-5 text-on-primary rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-on-surface-variant w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={clientSearchFilter}
            onChange={(e) => setClientSearchFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-on-surface-variant font-medium text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Ficha Cliente</th>
                <th className="px-6 py-4">Celular</th>
                <th className="px-6 py-4">Total Visitas</th>
                <th className="px-6 py-4">Faturamento Gasto</th>
                <th className="px-6 py-4">Programa Fidelidade</th>
                <th className="px-6 py-4">Última Visita</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients
                .filter((c) => c.name.toLowerCase().includes(clientSearchFilter.toLowerCase()))
                .map((cli) => (
                  <tr key={cli.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-on-surface text-xs leading-none">{cli.name}</p>
                        <span className="text-[10px] text-on-surface-variant">{cli.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{cli.phone}</td>
                    <td className="px-6 py-4 text-xs text-on-surface font-semibold">{cli.sales} vezes</td>
                    <td className="px-6 py-4 text-xs text-green-400 font-bold">€ {cli.spent.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono font-bold text-primary">{cli.loyaltyPoints} PTS</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">{cli.lastVisit}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setClients((p) =>
                              p.map((x) => {
                                if (x.id === cli.id) {
                                  const updated = { ...x, loyaltyPoints: x.loyaltyPoints + 100 };
                                  saveRow('clients', updated);
                                  return updated;
                                }
                                return x;
                              })
                            );
                            setAuditLogs((p) => [`[CRM] ${new Date().toLocaleTimeString()} - Pontos concedidos manual para ${cli.name}.`, ...p]);
                            triggerToast(`Pontuação bonificada para ${cli.name}! (+100 PTS)`);
                          }}
                          className="p-1 px-2 hover:bg-primary text-primary hover:text-on-primary rounded font-bold text-[10px] transition-colors cursor-pointer border border-primary/20"
                        >
                          +100 PTS Cortesia
                        </button>
                        <button
                          onClick={() => {
                            triggerToast(`Link de agendamento compartilhado via whatsapp com ${cli.name}`);
                          }}
                          className="p-1 px-2 bg-white/5 rounded text-xs text-on-surface-variant hover:text-white"
                        >
                          Lembrar Cliente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 4. BARBEIROS VIEW (Membros e Comissões)
export function BarbeirosView({
  barbers,
  setBarbers,
  appointments,
  isBarberFormExpanded,
  setIsBarberFormExpanded,
  newBarberForm,
  setNewBarberForm,
  barberCommission,
  setBarberCommission,
  handleToggleBarber,
  setAuditLogs,
  triggerToast
}: {
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  appointments: Appointment[];
  isBarberFormExpanded: boolean;
  setIsBarberFormExpanded: (b: boolean) => void;
  newBarberForm: { name: string; specialty: string; room: string };
  setNewBarberForm: React.Dispatch<React.SetStateAction<{ name: string; specialty: string; room: string }>>;
  barberCommission: number;
  setBarberCommission: (n: number) => void;
  handleToggleBarber: (id: string) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Especialistas & Repasse de Comissão
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Gerencie o quadro de colaboradores, mude presenças virtuais e estipule a divisão comissionada do dia.
          </p>
        </div>
        <button
          onClick={() => setIsBarberFormExpanded(!isBarberFormExpanded)}
          className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Cadastrar Especialista
        </button>
      </div>

      {isBarberFormExpanded && (
        <div className="glass-card p-6 rounded-2xl border border-primary/30 space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Smile className="w-4 h-4" /> Contratar Integrante da Equipe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Nome do Barbeiro</label>
              <input
                type="text"
                placeholder="Ex: Pedro Henrique"
                value={newBarberForm.name}
                onChange={(e) => setNewBarberForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Especialidade Principal</label>
              <input
                type="text"
                placeholder="Ex: Barba Clássica / Degradê"
                value={newBarberForm.specialty}
                onChange={(e) => setNewBarberForm((p) => ({ ...p, specialty: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Espaço / Cadeira</label>
              <input
                type="text"
                placeholder="Ex: Cadeira 06"
                value={newBarberForm.room}
                onChange={(e) => setNewBarberForm((p) => ({ ...p, room: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (!newBarberForm.name.trim()) {
                    triggerToast('Nome do barbeiro obrigatório!');
                    return;
                  }
                  const newB: Barber = {
                    id: `barb-${Date.now()}`,
                    name: newBarberForm.name,
                    specialty: newBarberForm.specialty || 'Cabeleireiro Unissex',
                    room: newBarberForm.room || 'Cadeira 05',
                    status: 'Livre',
                    rating: 5.0,
                    reviewsCount: 1,
                    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQa4toBZlARiJ3MHxhc3-BkXqP_IaeYjDedYr9nv-lgNRik0Idt9tb4fak4kyLCXjBfpJmiRlFy1Yz8S2J0iZAMgXXLut9eyfr5Iozqxuhnig_0dK2uVYGr6IYwISEeGSnk-LsK25Pzd4jbldvbgdoZgGRDuu4ws0eBmCg-V7PhH49mADOT1ntvzUBtaY-EZXEvE4DupKI7SqrfHvkBvxKUhqzA4rX-M55tj33swwbGk0oJxNzLt2suIkhwM9RmZ2VLvCWC_Ovb8M',
                  };
                  setBarbers((p) => [...p, newB]);
                  saveRow('barbers', newB);
                  setAuditLogs((p) => [`[STAFF] ${new Date().toLocaleTimeString()} - Profissional cadastrado: ${newBarberForm.name}`, ...p]);
                  triggerToast(`Membro ${newBarberForm.name} adicionado ao time!`);
                  setNewBarberForm({ name: '', specialty: '', room: 'Cadeira 05' });
                  setIsBarberFormExpanded(false);
                }}
                className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-2.5 rounded-lg text-xs"
              >
                Inaugurar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col justify-between text-left">
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-1">
              <Wallet className="w-4 h-4" /> Distribuição de Comissionamento
            </h4>
            <p className="text-xs text-on-surface-variant mb-4 font-medium">
              Taxa percentual destinada aos barbeiros do faturamento total que realizaram atendimento.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] text-primary font-bold uppercase block">Comissão dos Barbeiros</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={barberCommission}
                    onChange={(e) => setBarberCommission(parseInt(e.target.value))}
                    className="w-full accent-primary bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-lg font-mono font-bold text-white shrink-0">{barberCommission}%</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {barbers.map((b, idx) => {
                  const indyTotal = (idx === 0) ? 1150 : (idx === 1) ? 680 : 450;
                  const comm = indyTotal * (barberCommission / 100);
                  return (
                    <div key={b.id} className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                      <span className="text-xs text-on-surface-variant font-medium">{b.name}</span>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-primary">€ {comm.toFixed(2)}</span>
                        <p className="text-[8px] text-on-surface-variant leading-none">Comissão hoje</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Membros em Expediente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="glass-card p-5 rounded-2xl border border-white/5 hover:bg-white/[0.01] flex items-start gap-4"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 relative">
                    <Image
                      className="object-cover rounded-full"
                      alt={b.name}
                      src={b.avatarUrl}
                      fill
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-background ${b.status === 'Livre' ? 'bg-green-500' : b.status === 'Atendendo' ? 'bg-amber-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-on-surface truncate">{b.name}</h4>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-on-surface-variant font-bold">{b.room}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{b.specialty}</p>
                  <p className="text-xs text-amber-400 mt-2 font-bold font-mono">⭐ {b.rating.toFixed(1)} <span className="text-[10px] text-on-surface-variant font-medium">({b.reviewsCount} reviews)</span></p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleToggleBarber(b.id)}
                      className="w-full text-center py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-on-surface"
                    >
                      Alternar Status
                    </button>
                    <button
                      onClick={() => {
                        setBarbers((p) => p.filter((x) => x.id !== b.id));
                        deleteRow('barbers', b.id);
                        triggerToast('Especialista deletado da base.');
                      }}
                      className="p-1 px-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-on-surface-variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. SERVIÇOS VIEW (Catálogo)
export function ServicosView({
  services,
  setServices,
  isServiceFormExpanded,
  setIsServiceFormExpanded,
  newServiceForm,
  setNewServiceForm,
  setAuditLogs,
  triggerToast
}: {
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  isServiceFormExpanded: boolean;
  setIsServiceFormExpanded: (b: boolean) => void;
  newServiceForm: { name: string; price: string; duration: string; description: string };
  setNewServiceForm: React.Dispatch<React.SetStateAction<{ name: string; price: string; duration: string; description: string }>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary" />
            Catálogo de Serviços Disponíveis
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Insira serviços, recalcule faixas de preço e ajuste as durações estimadas de agendamentos.
          </p>
        </div>
        <button
          onClick={() => setIsServiceFormExpanded(!isServiceFormExpanded)}
          className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Catálogo
        </button>
      </div>

      {isServiceFormExpanded && (
        <div className="glass-card p-6 rounded-2xl border border-primary/30 space-y-4">
          <h4 className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> Cadastrar Novo Serviço Premium
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Título do Serviço</label>
              <input
                type="text"
                placeholder="Ex: Corte Artístico Degradê"
                value={newServiceForm.name}
                onChange={(e) => setNewServiceForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Preço de Venda (€)</label>
              <input
                type="number"
                placeholder="Ex: 60"
                value={newServiceForm.price}
                onChange={(e) => setNewServiceForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Duração Estimada</label>
              <select
                value={newServiceForm.duration}
                onChange={(e) => setNewServiceForm((p) => ({ ...p, duration: e.target.value }))}
                className="w-full bg-surface-container-high border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              >
                <option value="30 min" className="bg-[#1a1a1a] text-[#e5e2e1]">30 minutos</option>
                <option value="45 min" className="bg-[#1a1a1a] text-[#e5e2e1]">45 minutos</option>
                <option value="60 min" className="bg-[#1a1a1a] text-[#e5e2e1]">1 hora</option>
                <option value="90 min" className="bg-[#1a1a1a] text-[#e5e2e1]">1 hora e meia</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (!newServiceForm.name.trim() || !newServiceForm.price) {
                    triggerToast('Preencha o título e preço do serviço!');
                    return;
                  }
                  const newS = {
                    id: `srv-${Date.now()}`,
                    name: newServiceForm.name,
                    duration: newServiceForm.duration,
                    price: parseFloat(newServiceForm.price),
                    description: newServiceForm.description || 'Tratamento estético premium para barba e cabelo.',
                    iconKey: 'scissors',
                  };
                  setServices((p) => [...p, newS]);
                  saveRow('services', newS);
                  setAuditLogs((p) => [`[SERVICES] ${new Date().toLocaleTimeString()} - Novo cadastro de serviço no Catálogo: ${newServiceForm.name}`, ...p]);
                  triggerToast(`Serviço "${newServiceForm.name}" adicionado ao Catálogo!`);
                  setNewServiceForm({ name: '', price: '', duration: '30 min', description: '' });
                  setIsServiceFormExpanded(false);
                }}
                className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-2.5 rounded-lg text-xs"
              >
                Salvar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="glass-card p-5 rounded-2xl border border-white/5 hover:border-primary/20 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-bold text-on-surface text-sm leading-tight">{srv.name}</h4>
                </div>
                <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-on-surface-variant font-bold">
                  {srv.duration}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed min-h-[32px] mb-4">
                {srv.description}
              </p>
            </div>

            <div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-2 mb-4">
                <p className="text-[9px] text-on-surface-variant font-bold uppercase block">Valor Unitário (€)</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary font-mono">€</span>
                  <input
                    type="number"
                    value={srv.price}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      setServices((p) => p.map((x) => (x.id === srv.id ? { ...x, price: newPrice } : x)));
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm font-mono font-bold text-primary outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={async () => {
                      const success = await saveRow('services', srv);
                      if (success) {
                        triggerToast('Valor salvo com sucesso!');
                      } else {
                        triggerToast('Erro ao salvar valor.');
                      }
                    }}
                    className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-bold text-xs shrink-0 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] text-on-surface-variant font-mono">Refletido na interface pública</span>
                <button
                  onClick={() => {
                    if (services.length <= 1) {
                      triggerToast('Sua barbearia precisa de pelo menos um serviço ativo!');
                      return;
                    }
                    setServices((p) => p.filter((x) => x.id !== srv.id));
                    deleteRow('services', srv.id);
                    triggerToast('Serviço removido.');
                  }}
                  className="text-[10px] text-on-surface-variant hover:text-red-400 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. CAIXA VIEW
export function CaixaView({
  lucroLiquido,
  finances,
  setFinances,
  cashRegisterStatus,
  setCashRegisterStatus,
  cashTransactions,
  setCashTransactions,
  transactionSearchQuery,
  setTransactionSearchQuery,
  transactionTypeFilter,
  setTransactionTypeFilter,
  setIsFinancialModalOpen,
  setAuditLogs,
  triggerToast
}: {
  lucroLiquido: number;
  finances: any;
  setFinances: React.Dispatch<React.SetStateAction<any>>;
  cashRegisterStatus: 'aberto' | 'fechado';
  setCashRegisterStatus: (s: 'aberto' | 'fechado') => void;
  cashTransactions: CashTransaction[];
  setCashTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  transactionSearchQuery: string;
  setTransactionSearchQuery: (s: string) => void;
  transactionTypeFilter: 'Todos' | 'faturamento' | 'despesas';
  setTransactionTypeFilter: (s: any) => void;
  setIsFinancialModalOpen: (b: boolean) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-2xl relative">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Saldo de Caixa</p>
          <h4 className="text-2xl font-display font-bold text-green-400 mt-1">
            € {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
          <p className="text-[9px] text-on-surface-variant leading-none mt-1">Saldo operacional do caixa</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Receitas Totais</p>
          <h4 className="text-2xl font-display font-bold text-primary mt-1">
            € {finances.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Despesas Lançadas</p>
          <h4 className="text-2xl font-display font-bold text-red-400 mt-1">
            € {finances.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
        </div>
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-on-surface-variant font-bold uppercase">Expediente de Caixa</span>
            <span className={`w-2 h-2 rounded-full ${cashRegisterStatus === 'aberto' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs font-bold text-white uppercase font-mono">{cashRegisterStatus === 'aberto' ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}</span>
            <button
              onClick={() => {
                const nStat = cashRegisterStatus === 'aberto' ? 'fechado' : 'aberto';
                setCashRegisterStatus(nStat);
                setAuditLogs((p) => [`[FIN] ${new Date().toLocaleTimeString()} - Expediente de caixa: ${nStat.toUpperCase()}`, ...p]);
                triggerToast(`Caixa Operacional foi ${nStat.toUpperCase()}!`);
              }}
              className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold text-white cursor-pointer"
            >
              Trocar
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar transação por descrição..."
            value={transactionSearchQuery}
            onChange={(e) => setTransactionSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={transactionTypeFilter}
            onChange={(e) => setTransactionTypeFilter(e.target.value as any)}
            className="bg-surface-container-high border border-white/10 rounded-lg text-xs text-on-surface px-4 py-2 cursor-pointer"
          >
            <option value="Todos" className="bg-[#1a1a1a] text-[#e5e2e1]">Tudo</option>
            <option value="faturamento" className="bg-[#1a1a1a] text-[#e5e2e1]">Entradas (+)</option>
            <option value="despesas" className="bg-[#1a1a1a] text-[#e5e2e1]">Saídas (-)</option>
          </select>
          <button
            onClick={() => {
              if (cashRegisterStatus === 'fechado') {
                triggerToast('Abra o Expediente de Caixa primeiro!');
                return;
              }
              setIsFinancialModalOpen(true);
            }}
            className="bg-primary hover:brightness-110 text-on-primary font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Manual
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-on-surface-variant font-medium text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Lançamento</th>
                <th className="px-6 py-4 text-left">Tipo</th>
                <th className="px-6 py-4 text-left">Categoria</th>
                <th className="px-6 py-4 text-left">Valor</th>
                <th className="px-6 py-4 text-left">Data do Registro</th>
                <th className="px-6 py-4 text-center">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cashTransactions
                .filter((t) => t.description.toLowerCase().includes(transactionSearchQuery.toLowerCase()))
                .filter((t) => transactionTypeFilter === 'Todos' || t.type === transactionTypeFilter)
                .map((trans) => (
                  <tr key={trans.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface">{trans.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          trans.type === 'faturamento'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {trans.type === 'faturamento' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{trans.category || 'Geral'}</td>
                    <td className={`px-6 py-4 font-mono font-bold text-xs ${trans.type === 'faturamento' ? 'text-green-400' : 'text-red-400'}`}>
                      {trans.type === 'faturamento' ? '+' : '-'} € {trans.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">{trans.date}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setCashTransactions((prev) => prev.filter((p) => p.id !== trans.id));
                          if (trans.type === 'faturamento') {
                            setFinances((prev: any) => ({ ...prev, faturamento: Math.max(0, prev.faturamento - trans.amount) }));
                          } else {
                            setFinances((prev: any) => ({ ...prev, despesas: Math.max(0, prev.despesas - trans.amount) }));
                          }
                          setAuditLogs((p) => [`[FIN] ${new Date().toLocaleTimeString()} - Estorno de € ${trans.amount.toFixed(2)} efetuado.`, ...p]);
                          triggerToast('Lançamento estornado e saldos recalculados!');
                        }}
                        className="p-1 px-2 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold uppercase cursor-pointer"
                      >
                        Estornar
                      </button>
                    </td>
                  </tr>
                ))}
              {cashTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    Nenhum faturamento registrado em caixa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 7. CONTROLE VIEW (Syslogs & Massa de Teste)
export function ControleView({
  dailyTarget,
  setDailyTarget,
  setAppointments,
  setCashTransactions,
  setFinances,
  auditLogs,
  setAuditLogs,
  barbers,
  triggerToast
}: {
  dailyTarget: number;
  setDailyTarget: (n: number) => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setCashTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  setFinances: React.Dispatch<React.SetStateAction<any>>;
  auditLogs: string[];
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  barbers: Barber[];
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2 font-mono">
            <Sliders className="w-6 h-6 text-primary animate-spin" />
            NÚCLEO DE CONTROLE E SIMULAÇÃO
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Ajuste valores de tolerância e parâmetros operacionais do sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setFinances({ faturamento: 0, despesas: 0 });
            setAuditLogs([`[SUCESSO] ${new Date().toLocaleTimeString()} - Sistema operacional resetado para configurações originais de fábrica.`]);
            triggerToast('Saldos financeiros redefinidos!');
          }}
          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-on-surface hover:text-white transition-colors cursor-pointer shrink-0"
        >
          Limpar e Recalcular Saldos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-card p-6 rounded-2xl space-y-6">
          <h4 className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
            <Settings className="w-4 h-4 text-primary" /> Parâmetros Operacionais
          </h4>

          <div className="space-y-2">
            <label className="text-[10px] text-primary uppercase font-bold">Meta Financeira Diária (€)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono font-semibold focus:outline-none"
              />
              <button
                onClick={() => {
                  triggerToast(`Meta configurada para € ${dailyTarget}`);
                  setAuditLogs((p) => [`[CONFIG] ${new Date().toLocaleTimeString()} - Meta de vendas diárias atualizada para € ${dailyTarget}`, ...p]);
                }}
                className="bg-primary hover:brightness-110 text-on-primary font-bold px-4 rounded-lg text-xs"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Modo de Produção</p>
            <p className="text-xs text-on-surface-variant font-mono">
              Os injetores sintéticos foram desativados. Os logs espelham operações reais no esquema do banco de dados.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
              Syslog do Servidor de Banco de Dados
            </span>
            <button
              onClick={() => setAuditLogs([])}
              className="text-[10px] text-on-surface-variant font-mono hover:text-white"
            >
              Limpar Monitor
            </button>
          </div>

          <div className="flex-1 min-h-[300px] mt-4 p-4 bg-background/50 border border-white/5 rounded-xl text-left font-mono text-xs text-green-400 space-y-1.5 overflow-y-auto max-h-[340px] custom-scrollbar">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="line-clamp-1 hover:text-white transition-colors">
                {log}
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-on-surface-variant text-center py-12">Monitor de logs limpo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. ESTOQUE VIEW
export function EstoqueView({
  stockItems,
  setStockItems,
  inventorySearchQuery,
  setInventorySearchQuery,
  isProductFormExpanded,
  setIsProductFormExpanded,
  newProductForm,
  setNewProductForm,
  setSelectedRestockItem,
  setAuditLogs,
  triggerToast
}: {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  inventorySearchQuery: string;
  setInventorySearchQuery: (s: string) => void;
  isProductFormExpanded: boolean;
  setIsProductFormExpanded: (b: boolean) => void;
  newProductForm: { name: string; quantity: number };
  setNewProductForm: React.Dispatch<React.SetStateAction<{ name: string; quantity: number }>>;
  setSelectedRestockItem: (i: StockItem | null) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <Package className="w-6 h-6 text-primary animate-bounce" />
            Inventário de Suprimentos
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Gerencie o estoque mínimo. Quando um produto atingir menos de 3 unidades, um aviso crítico se destacará no topo da tela.
          </p>
        </div>
        <button
          onClick={() => setIsProductFormExpanded(!isProductFormExpanded)}
          className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 hover:brightness-110 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Material
        </button>
      </div>

      {isProductFormExpanded && (
        <div className="glass-card p-6 rounded-2xl border border-primary/30 space-y-4">
          <h4 className="text-sm font-bold text-primary uppercase flex items-center gap-1">
            <Package className="w-4 h-4" /> Cadastrar Material Consumível
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Título do Material</label>
              <input
                type="text"
                placeholder="Ex: Tolhas de Barbaterapia Secantes"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-primary uppercase font-bold">Quantidade Mínima Inicial</label>
              <input
                type="number"
                placeholder="Ex: 10"
                value={newProductForm.quantity}
                onChange={(e) => setNewProductForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (!newProductForm.name.trim()) {
                    triggerToast('Defina o nome do insumo!');
                    return;
                  }
                  const qty = newProductForm.quantity;
                  const stat = qty === 0 ? 'Estoque crítico' : qty < 3 ? 'Estoque baixo' : 'Estoque normal';
                  const newItem: StockItem = {
                    id: `st-${Date.now()}`,
                    name: newProductForm.name,
                    quantity: qty,
                    status: stat,
                    category: qty === 0 ? 'warning' : 'inventory',
                  };
                  setStockItems((p) => [...p, newItem]);
                  saveRow('stock_items', newItem);
                  triggerToast(`Insumo "${newProductForm.name}" inserido com sucesso!`);
                  setAuditLogs((p) => [`[INV] ${new Date().toLocaleTimeString()} - Material catalogado: ${newProductForm.name}`, ...p]);
                  setNewProductForm({ name: '', quantity: 10 });
                  setIsProductFormExpanded(false);
                }}
                className="w-full bg-primary hover:brightness-110 text-on-primary font-bold py-2.5 rounded-lg text-xs"
              >
                Cadastrar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 text-on-surface-variant w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar material no estoque..."
            value={inventorySearchQuery}
            onChange={(e) => setInventorySearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-on-surface"
          />
        </div>
        <div className="text-right text-xs text-on-surface-variant font-semibold">
          Alertas Ativos: <span className="text-amber-400 font-bold font-mono">{stockItems.filter(s => s.status !== 'Estoque normal').length} un</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-on-surface-variant font-medium text-xs uppercase tracking-wider">
              <th className="px-6 py-4 text-left">Insumo</th>
              <th className="px-6 py-4 text-left">Nível de Risco</th>
              <th className="px-6 py-4 text-left">Quantidade Restante</th>
              <th className="px-6 py-4 text-center">Consumo Rápido</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stockItems
              .filter((item) => item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()))
              .map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface text-xs">{item.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block border ${
                        item.status === 'Estoque crítico'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : item.status === 'Estoque baixo'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-xs text-on-surface">{item.quantity} unidades</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setStockItems((p) =>
                          p.map((s) => {
                            if (s.id === item.id) {
                              const newQty = Math.max(0, s.quantity - 1);
                              const newStat: StockItem['status'] = newQty === 0 ? 'Estoque crítico' : newQty < 3 ? 'Estoque baixo' : 'Estoque normal';
                              const updated: StockItem = { ...s, quantity: newQty, status: newStat };
                              saveRow('stock_items', updated);
                              return updated;
                            }
                            return s;
                          })
                        );
                        triggerToast(`Usado 1 unidade de ${item.name}`);
                      }}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-on-surface-variant font-bold cursor-pointer"
                    >
                      Consumir 1 Unidade
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => setSelectedRestockItem(item)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Repor (+15 un)
                      </button>
                      <button
                        onClick={() => {
                          setStockItems((p) => p.filter((x) => x.id !== item.id));
                          deleteRow('stock_items', item.id);
                          triggerToast('Produto excluído.');
                        }}
                        className="text-on-surface-variant hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 9. FIDELIZAÇÃO VIEW
export function FidelizacaoView({
  clients,
  setClients,
  loyaltyRewardSelection,
  setLoyaltyRewardSelection,
  setAuditLogs,
  triggerToast
}: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  loyaltyRewardSelection: string;
  setLoyaltyRewardSelection: (s: string) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerToast: (m: string) => void;
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          Programa de Cashback & Prêmios de Fidelidade
        </h3>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Acompanhe os pontos de fidelidade gerados pelos gastos dos clientes e processe resgate de prêmios autorizados de forma simplificada em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-white/5 pb-2"> Catálogo de Brindes de Campanha</h4>
            <div className="space-y-3">
              {[
                { name: 'Corte de Cabelo Gratuito', cost: 100, desc: 'Isenta o valor de qualquer corte masculino comum' },
                { name: 'Toalete e Barbaterapia Quente', cost: 60, desc: 'Isenta o valor do tratamento estético de toalha clássica' },
                { name: 'Finalização Modeladora Pomada', cost: 30, desc: 'Isenta o valor do tubo estilizador' },
                { name: 'Tratamento Estético Integrado', cost: 200, desc: 'Corte + Barba + Lavagem com hidratação gratuita' }
              ].map((reward, idx) => (
                <div key={idx} className="p-3 bg-white/[0.01] hover:bg-white/5 border border-white/5 rounded-xl flex justify-between items-center transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-on-surface">{reward.name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{reward.desc}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded shrink-0">
                    {reward.cost} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 text-xs text-on-surface-variant">
            Ao marcar reservas como Concluídas no Dashboard ou na Agenda, a pontuação acumula proporcionalmente 1:1.
          </div>
        </div>

        <div className="lg:col-span-7 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Resgate de Créditos</h4>
            
            <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-primary uppercase font-bold">Escolha a Recompensa Alvo</span>
                <select
                  value={loyaltyRewardSelection}
                  onChange={(e) => setLoyaltyRewardSelection(e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg p-2 mt-1 py-1.5 text-xs text-on-surface cursor-pointer focus:outline-none"
                >
                  <option value="corte-gratis" className="bg-[#1a1a1a] text-[#e5e2e1]">Corte de Cabelo Gratuito (100 PTS)</option>
                  <option value="barba-premium" className="bg-[#1a1a1a] text-[#e5e2e1]">Toalete e Barbaterapia Quente (60 PTS)</option>
                  <option value="lavagem" className="bg-[#1a1a1a] text-[#e5e2e1]">Finalização Modeladora Pomada (30 PTS)</option>
                  <option value="combo-especial" className="bg-[#1a1a1a] text-[#e5e2e1]">Tratamento Estético Integrado (200 PTS)</option>
                </select>
              </div>
              <div className="text-[9px] text-on-surface-variant max-w-[200px]">
                O débito de pontos ocorrerá imediatamente na ficha do cliente escolhido abaixo.
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {clients.map((cli) => {
                const cost = loyaltyRewardSelection === 'corte-gratis' ? 100 : loyaltyRewardSelection === 'barba-premium' ? 60 : loyaltyRewardSelection === 'lavagem' ? 30 : 200;
                const hasSufficient = cli.loyaltyPoints >= cost;

                return (
                  <div key={cli.id} className="p-3 bg-white/[0.01] hover:bg-white/5 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors">
                    <div className="text-left">
                      <p className="text-xs font-bold text-on-surface">{cli.name}</p>
                      <span className="text-[10px] text-primary font-mono block mt-1">Saldo Atual: {cli.loyaltyPoints} PTS</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!hasSufficient) {
                            triggerToast('Saldo insuficiente de pontos!');
                            return;
                          }
                          setClients((p) =>
                            p.map((x) => {
                              if (x.id === cli.id) {
                                const updated = { ...x, loyaltyPoints: x.loyaltyPoints - cost };
                                saveRow('clients', updated);
                                return updated;
                              }
                              return x;
                            })
                          );
                          setAuditLogs((p) => [`[LOYALTY] ${new Date().toLocaleTimeString()} - Resgate de brinde com sucesso de ${cli.name}.`, ...p]);
                          triggerToast(`Resgatado com sucesso para ${cli.name}! (-${cost} PTS)`);
                        }}
                        disabled={!hasSufficient}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          hasSufficient
                            ? 'bg-green-500 hover:brightness-110 text-on-primary'
                            : 'bg-white/5 text-on-surface-variant/40 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        Confirmar Resgate
                      </button>
                      <button
                        onClick={() => {
                          setClients((p) =>
                            p.map((x) => {
                              if (x.id === cli.id) {
                                const updated = { ...x, loyaltyPoints: x.loyaltyPoints + 100 };
                                saveRow('clients', updated);
                                return updated;
                              }
                              return x;
                            })
                          );
                          setAuditLogs((p) => [`[LOYALTY] ${new Date().toLocaleTimeString()} - +100 PTS concedidos a ${cli.name}`, ...p]);
                          triggerToast(`Cortesia de +100 PTS adicionada para ${cli.name}!`);
                        }}
                        className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-on-surface hover:text-white"
                      >
                        +100 PTS Bônus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
