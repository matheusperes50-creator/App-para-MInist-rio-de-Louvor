import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceEvent, 
  AttendanceConfirmation, 
  Member, 
  Schedule, 
  ScheduleAssignment, 
  Role, 
  ViewType 
} from '../types';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Share2, 
  Calendar, 
  Check, 
  X, 
  ChevronDown, 
  MessageSquare, 
  Mic, 
  Users,
  Search, 
  Eye,
  Settings2,
  Link2,
  Copy
} from 'lucide-react';

interface AttendanceProps {
  attendanceEvents: AttendanceEvent[];
  setAttendanceEvents: React.Dispatch<React.SetStateAction<AttendanceEvent[]>>;
  members: Member[];
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  setView: (view: ViewType) => void;
  isAdmin: boolean;
  onSaveToCloud?: (payload?: any) => Promise<boolean | void>;
  onSync?: () => void;
  isSyncing?: boolean;
}

const generateId = () => `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

// Formatar data em português com dia da semana de forma segura
const formatDateDisplay = (dateStr: string): { weekday: string; shortDate: string; fullText: string } => {
  if (!dateStr) return { weekday: '', shortDate: '', fullText: '' };
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return {
      weekday: capitalizedWeekday,
      shortDate: formattedDate,
      fullText: `${capitalizedWeekday}, ${formattedDate}`
    };
  } catch {
    return { weekday: '', shortDate: dateStr, fullText: dateStr };
  }
};

export const Attendance: React.FC<AttendanceProps> = ({
  attendanceEvents = [],
  setAttendanceEvents,
  members = [],
  schedules = [],
  setSchedules,
  setView,
  isAdmin,
  onSaveToCloud
}) => {
  // Integrante atualmente selecionado para votar (salvo no localStorage)
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('louvor_current_member_id');
      if (saved) return saved;
    } catch {}
    const firstActive = (members || []).find(m => m.isActive);
    return firstActive ? firstActive.id : '';
  });

  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Modais de administração e visualização
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showMonthGenModal, setShowMonthGenModal] = useState(false);
  const [viewingVotesEventId, setViewingVotesEventId] = useState<string | null>(null);

  // Campos do formulário de nova data
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('Culto de Domingo - Noite');
  const [formTime, setFormTime] = useState('19:00');
  const [formDescription, setFormDescription] = useState('');

  // Gerador de Domingos do Mês
  const [monthToGen, setMonthToGen] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [genServiceTitle, setGenServiceTitle] = useState('Culto de Domingo - Noite');
  const [genServiceTime, setGenServiceTime] = useState('19:00');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeMembers = useMemo(() => {
    return (members || []).filter(m => m.isActive);
  }, [members]);

  const currentMember = useMemo(() => {
    return activeMembers.find(m => m.id === currentMemberId) || activeMembers[0];
  }, [activeMembers, currentMemberId]);

  // Se o integrante selecionado não existir mais, reseta para o primeiro
  useEffect(() => {
    if (!currentMember && activeMembers.length > 0) {
      setCurrentMemberId(activeMembers[0].id);
    }
  }, [activeMembers, currentMember]);

  // Salvar integrante selecionado
  const handleSelectMember = (id: string) => {
    setCurrentMemberId(id);
    try {
      localStorage.setItem('louvor_current_member_id', id);
    } catch {}
    setShowMemberPicker(false);
    const m = members.find(item => item.id === id);
    if (m) {
      showToast(`Você agora está respondendo como ${m.name}`);
    }
  };

  // Obter quem confirmou presença em uma data específica
  const getConfirmedMembersForEvent = (event: AttendanceEvent): Member[] => {
    const confirmedSet = new Set(
      (event.confirmations || [])
        .filter(c => c.status === 'confirmed')
        .map(c => c.memberId)
    );
    return activeMembers.filter(m => confirmedSet.has(m.id));
  };

  // Verificar se um integrante específico confirmou presença
  const isMemberConfirmed = (event: AttendanceEvent, memberId: string) => {
    return (event.confirmations || []).some(c => c.memberId === memberId && c.status === 'confirmed');
  };

  // Votar / Alternar confirmação do membro atual (1 toque, estilo WhatsApp Poll)
  const handleToggleVote = async (eventId: string) => {
    if (!currentMember) {
      setShowMemberPicker(true);
      return;
    }

    const event = attendanceEvents.find(e => e.id === eventId);
    if (!event) return;

    const alreadyConfirmed = isMemberConfirmed(event, currentMember.id);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedEvents = attendanceEvents.map(evt => {
      if (evt.id !== eventId) return evt;

      const currentConfirmations = evt.confirmations || [];
      let nextConfirmations: AttendanceConfirmation[];

      if (alreadyConfirmed) {
        nextConfirmations = currentConfirmations.filter(c => c.memberId !== currentMember.id);
      } else {
        const existingIdx = currentConfirmations.findIndex(c => c.memberId === currentMember.id);
        if (existingIdx >= 0) {
          nextConfirmations = currentConfirmations.map((c, i) => 
            i === existingIdx ? { ...c, status: 'confirmed', confirmedAt: nowStr } : c
          );
        } else {
          nextConfirmations = [
            ...currentConfirmations,
            { memberId: currentMember.id, status: 'confirmed', confirmedAt: nowStr }
          ];
        }
      }

      return {
        ...evt,
        confirmations: nextConfirmations
      };
    });

    setAttendanceEvents(updatedEvents);

    if (alreadyConfirmed) {
      showToast(`Presença desmarcada para ${event.title}`);
    } else {
      showToast(`✅ Presença confirmada para ${event.title}!`);
    }

    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updatedEvents });
    }
  };

  // Marcar ou desmarcar todas as datas para o membro atual
  const handleVoteAll = (confirmAll: boolean) => {
    if (!currentMember) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedEvents = attendanceEvents.map(evt => {
      const currentConfirmations = evt.confirmations || [];
      if (confirmAll) {
        const withoutCurrent = currentConfirmations.filter(c => c.memberId !== currentMember.id);
        return {
          ...evt,
          confirmations: [
            ...withoutCurrent,
            { memberId: currentMember.id, status: 'confirmed' as const, confirmedAt: nowStr }
          ]
        };
      } else {
        return {
          ...evt,
          confirmations: currentConfirmations.filter(c => c.memberId !== currentMember.id)
        };
      }
    });

    setAttendanceEvents(updatedEvents);
    showToast(confirmAll ? '✅ Todas as datas confirmadas!' : 'Todas as presenças foram desmarcadas.');
    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updatedEvents });
    }
  };

  // Alternar confirmação de qualquer membro (usado pelo Admin no modal Ver Votos)
  const handleToggleMemberVoteByAdmin = (eventId: string, memberId: string) => {
    const event = attendanceEvents.find(e => e.id === eventId);
    if (!event) return;

    const alreadyConfirmed = isMemberConfirmed(event, memberId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedEvents = attendanceEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      const currentConfirmations = evt.confirmations || [];
      let nextConfirmations: AttendanceConfirmation[];

      if (alreadyConfirmed) {
        nextConfirmations = currentConfirmations.filter(c => c.memberId !== memberId);
      } else {
        nextConfirmations = [
          ...currentConfirmations.filter(c => c.memberId !== memberId),
          { memberId, status: 'confirmed' as const, confirmedAt: nowStr }
        ];
      }

      return { ...evt, confirmations: nextConfirmations };
    });

    setAttendanceEvents(updatedEvents);
    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updatedEvents });
    }
  };

  // Adicionar uma nova data à enquete
  const handleAddDateOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;

    const newEvent: AttendanceEvent = {
      id: generateId(),
      date: formDate,
      title: formTitle.trim() || 'Culto de Louvor',
      time: formTime || '19:00',
      description: formDescription.trim() || undefined,
      confirmations: []
    };

    const updated = [...attendanceEvents, newEvent].sort((a, b) => a.date.localeCompare(b.date));
    setAttendanceEvents(updated);
    setShowAddDateModal(false);
    setFormDate('');
    showToast(`Data adicionada à enquete: ${newEvent.title}`);

    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updated });
    }
  };

  // Gerar todos os domingos do mês na enquete (estilo WhatsApp)
  const handleGenerateSundays = () => {
    if (!monthToGen) return;
    const [yearStr, monthStr] = monthToGen.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    const sundays: string[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 0) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        sundays.push(`${y}-${m}-${d}`);
      }
      date.setDate(date.getDate() + 1);
    }

    if (sundays.length === 0) {
      showToast('Nenhum domingo encontrado para este mês.');
      return;
    }

    const existingDates = new Set(attendanceEvents.map(e => e.date));
    const newEvents: AttendanceEvent[] = sundays
      .filter(d => !existingDates.has(d))
      .map(d => ({
        id: generateId(),
        date: d,
        title: genServiceTitle,
        time: genServiceTime,
        confirmations: []
      }));

    if (newEvents.length === 0) {
      showToast('Todos os domingos deste mês já estão na enquete!');
      setShowMonthGenModal(false);
      return;
    }

    const updated = [...attendanceEvents, ...newEvents].sort((a, b) => a.date.localeCompare(b.date));
    setAttendanceEvents(updated);
    setShowMonthGenModal(false);
    showToast(`🎉 ${newEvents.length} domingos adicionados à enquete com sucesso!`);

    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updated });
    }
  };

  // Excluir uma data da enquete
  const handleDeleteDate = (eventId: string) => {
    if (!confirm('Deseja realmente remover esta data da enquete?')) return;
    const updated = attendanceEvents.filter(e => e.id !== eventId);
    setAttendanceEvents(updated);
    if (viewingVotesEventId === eventId) {
      setViewingVotesEventId(null);
    }
    showToast('Data removida da enquete.');
    if (onSaveToCloud) {
      onSaveToCloud({ attendanceEvents: updated });
    }
  };

  // GERAR ESCALA DE UM CULTO ESPECÍFICO (1 MINISTRO + 4 VOCAIS + BANDA)
  const handleGenerateScheduleFromEvent = (event: AttendanceEvent) => {
    const confirmed = getConfirmedMembersForEvent(event);
    if (confirmed.length === 0) {
      showToast('Nenhum integrante confirmou presença nesta data para gerar a escala.');
      return;
    }

    const assignments: ScheduleAssignment[] = [];
    const usedMemberIds = new Set<string>();
    const leaderIds: string[] = [];
    const vocalIds: string[] = [];

    // 1. Ministro (Prioriza quem possui a função oficial de Ministro no cadastro)
    const ministerCandidates = confirmed.filter(m => m.roles.includes(Role.MINISTER));
    const selectedMinister = ministerCandidates[0] || confirmed.find(m => m.roles.includes(Role.VOCAL)) || confirmed[0];

    if (selectedMinister) {
      assignments.push({
        role: 'Ministro',
        memberId: selectedMinister.id,
        confirmed: true,
        present: true
      });
      usedMemberIds.add(selectedMinister.id);
      leaderIds.push(selectedMinister.id);
    }

    // 2. Até 4 Vocais (escolhidos entre os integrantes confirmados com função Vocal)
    const vocalCandidates = confirmed.filter(m => 
      !usedMemberIds.has(m.id) && m.roles.includes(Role.VOCAL)
    );

    const vocalTargetCount = Math.min(4, vocalCandidates.length);
    for (let i = 0; i < vocalTargetCount; i++) {
      const v = vocalCandidates[i];
      assignments.push({
        role: 'Vocal',
        memberId: v.id,
        confirmed: true,
        present: true
      });
      usedMemberIds.add(v.id);
      vocalIds.push(v.id);
    }

    // 3. Instrumentistas disponíveis confirmados
    const instrumentConfigs: { roleName: string; enumRole: Role }[] = [
      { roleName: 'Teclado', enumRole: Role.KEYS },
      { roleName: 'Violão', enumRole: Role.GUITAR },
      { roleName: 'Guitarra', enumRole: Role.GUITAR },
      { roleName: 'Baixo', enumRole: Role.BASS },
      { roleName: 'Bateria', enumRole: Role.DRUMS }
    ];

    for (const config of instrumentConfigs) {
      const instMember = confirmed.find(m => 
        !usedMemberIds.has(m.id) && m.roles.includes(config.enumRole)
      );
      if (instMember) {
        assignments.push({
          role: config.roleName,
          memberId: instMember.id,
          confirmed: true,
          present: true
        });
        usedMemberIds.add(instMember.id);
      }
    }

    // 4. Integrantes confirmados restantes entram como apoio vocal/instrumental
    const remainingConfirmed = confirmed.filter(m => !usedMemberIds.has(m.id));
    for (const rem of remainingConfirmed) {
      assignments.push({
        role: rem.roles[0] || 'Vocal',
        memberId: rem.id,
        confirmed: true,
        present: true
      });
      usedMemberIds.add(rem.id);
      if (rem.roles.includes(Role.VOCAL)) {
        vocalIds.push(rem.id);
      }
    }

    // Criar nova escala oficial
    const newScheduleId = `SCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newSchedule: Schedule = {
      id: newScheduleId,
      date: event.date,
      serviceType: event.title,
      members: Array.from(usedMemberIds),
      assignments,
      songs: [],
      leaderIds,
      vocalIds,
      confirmed: true
    };

    const updatedSchedules = [newSchedule, ...schedules.filter(s => s.date !== event.date)];
    setSchedules(updatedSchedules);

    // Salvar ID da escala no evento de presença
    const updatedEvents = attendanceEvents.map(e => 
      e.id === event.id ? { ...e, createdScheduleId: newScheduleId } : e
    );
    setAttendanceEvents(updatedEvents);

    showToast(`🎉 Escala de ${event.title} criada com os confirmados!`);

    if (onSaveToCloud) {
      onSaveToCloud({
        schedules: updatedSchedules,
        attendanceEvents: updatedEvents
      });
    }

    if (viewingVotesEventId === event.id) {
      setViewingVotesEventId(null);
    }
  };

  // GERAR TODAS AS ESCALAS COM 1 CLIQUE A PARTIR DOS VOTOS
  const handleGenerateAllSchedules = () => {
    if (attendanceEvents.length === 0) return;
    let createdCount = 0;
    const newSchedulesMap = new Map<string, Schedule>();

    attendanceEvents.forEach(evt => {
      const confirmed = getConfirmedMembersForEvent(evt);
      if (confirmed.length === 0) return;

      const assignments: ScheduleAssignment[] = [];
      const usedMemberIds = new Set<string>();
      const leaderIds: string[] = [];
      const vocalIds: string[] = [];

      // Ministro (1 Ministro escolhido da função Ministro)
      const ministerCandidates = confirmed.filter(m => m.roles.includes(Role.MINISTER));
      const minister = ministerCandidates[0] || confirmed[0];
      if (minister) {
        assignments.push({ role: 'Ministro', memberId: minister.id, confirmed: true, present: true });
        usedMemberIds.add(minister.id);
        leaderIds.push(minister.id);
      }

      // Vocais (até 4)
      const vocalCandidates = confirmed.filter(m => !usedMemberIds.has(m.id) && m.roles.includes(Role.VOCAL));
      vocalCandidates.slice(0, 4).forEach((v) => {
        assignments.push({ role: 'Vocal', memberId: v.id, confirmed: true, present: true });
        usedMemberIds.add(v.id);
        vocalIds.push(v.id);
      });

      // Instrumentos
      const instrumentConfigs: { roleName: string; enumRole: Role }[] = [
        { roleName: 'Teclado', enumRole: Role.KEYS },
        { roleName: 'Violão', enumRole: Role.GUITAR },
        { roleName: 'Guitarra', enumRole: Role.GUITAR },
        { roleName: 'Baixo', enumRole: Role.BASS },
        { roleName: 'Bateria', enumRole: Role.DRUMS }
      ];

      for (const config of instrumentConfigs) {
        const instMember = confirmed.find(m => !usedMemberIds.has(m.id) && m.roles.includes(config.enumRole));
        if (instMember) {
          assignments.push({ role: config.roleName, memberId: instMember.id, confirmed: true, present: true });
          usedMemberIds.add(instMember.id);
        }
      }

      const schId = `SCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      newSchedulesMap.set(evt.date, {
        id: schId,
        date: evt.date,
        serviceType: evt.title,
        members: Array.from(usedMemberIds),
        assignments,
        songs: [],
        leaderIds,
        vocalIds,
        confirmed: true
      });
      createdCount++;
    });

    if (createdCount === 0) {
      showToast('Nenhum culto com presenças confirmadas.');
      return;
    }

    const updated = [
      ...Array.from(newSchedulesMap.values()),
      ...schedules.filter(s => !newSchedulesMap.has(s.date))
    ];
    setSchedules(updated);
    showToast(`🚀 ${createdCount} escalas geradas com sucesso a partir dos votos da enquete!`);

    if (onSaveToCloud) {
      onSaveToCloud({ schedules: updated });
    }
  };

  // Obter link direto para a página de presença
  const getDirectAttendanceUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=presenca`;
  };

  const handleCopyDirectLink = async () => {
    const url = getDirectAttendanceUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Link direto copiado! Envie no WhatsApp para os integrantes entrarem direto na enquete.');
    } catch {
      showToast(`Link: ${url}`);
    }
  };

  const handleShareDirectLink = async () => {
    const url = getDirectAttendanceUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Confirmação de Presença - Ministério de Louvor',
          text: 'Olá equipe! Por favor, confirmem as datas em que podem servir:',
          url
        });
      } catch (err) {}
    } else {
      handleCopyDirectLink();
    }
  };

  // COPIAR ENQUETE FORMATADA PARA WHATSAPP
  const handleCopyWhatsAppPoll = () => {
    if (attendanceEvents.length === 0) {
      showToast('Nenhuma data na enquete para copiar.');
      return;
    }

    let text = `📊 *ENQUETE DE DISPONIBILIDADE - MINISTÉRIO DE LOUVOR*\n`;
    text += `Olá equipe! Por favor, confirmem em quais datas vocês poderão servir este mês:\n\n`;

    attendanceEvents.forEach((evt, idx) => {
      const dt = formatDateDisplay(evt.date);
      const confirmed = getConfirmedMembersForEvent(evt);
      text += `*${idx + 1}️⃣ ${dt.fullText} - ${evt.title} (${evt.time || '19h'})*\n`;
      text += `   ↳ *${confirmed.length} confirmados:* `;
      if (confirmed.length === 0) {
        text += `_Ainda nenhum voto_\n`;
      } else {
        text += `${confirmed.map(m => m.name.split(' ')[0]).join(', ')}\n`;
      }
      text += `\n`;
    });

    const directUrl = getDirectAttendanceUrl();
    text += `📲 *Para votar direto pelo celular com 1 clique, acesse:*\n${directUrl}\n\nDeus abençoe! 🙏`;

    navigator.clipboard.writeText(text);
    showToast('📋 Texto da enquete copiado com o link direto! Cole no grupo do WhatsApp.');
  };

  // Cálculo da porcentagem de votos para a barra de progresso estilo WhatsApp
  const maxVotes = useMemo(() => {
    let max = 0;
    attendanceEvents.forEach(evt => {
      const count = getConfirmedMembersForEvent(evt).length;
      if (count > max) max = count;
    });
    return Math.max(max, activeMembers.length > 0 ? activeMembers.length : 1);
  }, [attendanceEvents, activeMembers]);

  // Evento atualmente em exibição de votos
  const viewingEvent = useMemo(() => {
    return attendanceEvents.find(e => e.id === viewingVotesEventId) || null;
  }, [attendanceEvents, viewingVotesEventId]);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO DA ABA PRESENÇA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Estilo Enquete do WhatsApp
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Confirmação de Presença
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Vote nas datas em que você pode servir. O administrador cria as datas e o aplicativo gera as escalas automaticamente com os confirmados.
            </p>
          </div>

          {/* SELETOR DE INTEGRANTE (QUEM ESTÁ VOTANDO) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden">
                {currentMember?.photoUrl ? (
                  <img src={currentMember.photoUrl} alt={currentMember.name} className="w-full h-full object-cover" />
                ) : (
                  currentMember?.name?.substring(0, 2).toUpperCase() || '?'
                )}
              </div>
              <div className="text-left truncate">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Você está votando como:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">
                  {currentMember?.name || 'Selecione seu nome'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowMemberPicker(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1 shrink-0"
              title="Trocar integrante"
            >
              Trocar
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BARRA DE AÇÕES DO ADMINISTRADOR */}
        {isAdmin && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              Painel Admin:
            </span>

            <button
              onClick={() => setShowAddDateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Adicionar Data
            </button>

            <button
              onClick={() => setShowMonthGenModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-500" />
              Gerar Domingos do Mês
            </button>

            <button
              onClick={handleGenerateAllSchedules}
              disabled={attendanceEvents.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-amber-500/20 disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Escalas de Todos os Cultos
            </button>

            <button
              onClick={handleCopyDirectLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition-all shadow-xs"
              title="Copiar link direto para os integrantes acessarem e votarem"
            >
              <Link2 className="w-4 h-4 text-emerald-600" />
              Copiar Link Direto
            </button>

            <button
              onClick={handleCopyWhatsAppPoll}
              disabled={attendanceEvents.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all ml-auto disabled:opacity-40"
              title="Copiar texto da enquete para o grupo do WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              Copiar p/ WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* BANNER DE LINK DIRETO PARA COMPARTILHAR COM A EQUIPE */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white text-sm">
                Link Direto para Confirmar Presença
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                Acesso Rápido
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Ao entrar por este link, os participantes caem <strong>diretamente nesta página</strong> de confirmação de presença (sem precisar de senha).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={handleCopyDirectLink}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            title="Copiar link direto para a área de transferência"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link da Presença
          </button>
          <button
            onClick={handleShareDirectLink}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Compartilhar no WhatsApp ou outro app"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* O CARD DA ENQUETE ESTILO WHATSAPP */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        {/* Topo do balão da enquete */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              🗓️ Enquete de Disponibilidade para os Cultos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Marque todas as opções em que você pode participar. Toque na data para confirmar ou desmarcar.
            </p>
          </div>

          {/* Atalhos rápidos para o integrante */}
          {attendanceEvents.length > 0 && currentMember && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => handleVoteAll(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                ✓ Marcar todas
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                onClick={() => handleVoteAll(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕ Desmarcar todas
              </button>
            </div>
          )}
        </div>

        {/* LISTA DE OPÇÕES (DATAS) */}
        {attendanceEvents.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Nenhuma data cadastrada na enquete
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Como administrador, clique abaixo para gerar os domingos do mês ou adicionar datas avulsas para os integrantes confirmarem presença.
            </p>
            {isAdmin && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowMonthGenModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Gerar Domingos do Mês Agora
                </button>
                <button
                  onClick={() => setShowAddDateModal(true)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Data Manual
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {attendanceEvents.map((event) => {
              const dt = formatDateDisplay(event.date);
              const confirmedList = getConfirmedMembersForEvent(event);
              const isChecked = currentMember ? isMemberConfirmed(event, currentMember.id) : false;
              const voteCount = confirmedList.length;
              
              // Porcentagem para a barra de progresso estilo WhatsApp
              const percentage = Math.min(100, Math.round((voteCount / (maxVotes || 1)) * 100));

              return (
                <div
                  key={event.id}
                  className={`group relative rounded-2xl border transition-all overflow-hidden ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* BARRA DE PROGRESSO EMERALD (ESTILO WHATSAPP) */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 pointer-events-none ${
                      isChecked
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800/60'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  {/* CONTEÚDO DA OPÇÃO */}
                  <div className="relative p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* PARTE ESQUERDA: CHECKBOX + DATA + TÍTULO */}
                    <div 
                      onClick={() => handleToggleVote(event.id)}
                      className="flex items-start md:items-center gap-3.5 flex-1 cursor-pointer select-none"
                    >
                      {/* Checkbox circular do WhatsApp */}
                      <div className="mt-0.5 md:mt-0 shrink-0">
                        {isChecked ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md scale-105 transition-transform animate-in zoom-in-50">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-500 transition-colors flex items-center justify-center bg-white dark:bg-slate-900" />
                        )}
                      </div>

                      {/* Textos da Data */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-base font-bold tracking-tight ${
                            isChecked ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-900 dark:text-white'
                          }`}>
                            {dt.weekday}, {dt.shortDate}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {event.time || '19:00'}
                          </span>
                          {event.createdScheduleId && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Escala Gerada
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {event.title}
                          {event.description ? ` • ${event.description}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* PARTE DIREITA: VOTOS + AVATARES + AÇÕES */}
                    <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                      {/* Avatares dos votantes (Pilha de fotos) */}
                      <div className="flex items-center gap-2">
                        {voteCount > 0 && (
                          <div className="flex -space-x-2 overflow-hidden items-center">
                            {confirmedList.slice(0, 4).map(m => (
                              <div
                                key={m.id}
                                title={m.name}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center overflow-hidden shrink-0"
                              >
                                {m.photoUrl ? (
                                  <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  m.name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                            ))}
                            {voteCount > 4 && (
                              <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                +{voteCount - 4}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contagem de votos em negrito */}
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>

                      {/* Botão Ver Votos (WhatsApp Style) */}
                      <button
                        onClick={() => setViewingVotesEventId(event.id)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver votos
                      </button>

                      {/* Ações do Admin em cada data */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {/* Gerar escala rápida para esta data */}
                          <button
                            onClick={() => handleGenerateScheduleFromEvent(event)}
                            disabled={voteCount === 0}
                            title="Gerar escala deste culto com os confirmados"
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors disabled:opacity-30"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Excluir data */}
                          <button
                            onClick={() => handleDeleteDate(event.id)}
                            title="Remover data da enquete"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé da Enquete */}
        {attendanceEvents.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
            <div>
              Total de <strong>{attendanceEvents.length}</strong> datas na enquete •{' '}
              {activeMembers.length} integrantes ativos no ministério
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateAllSchedules}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar todas as escalas dos votos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: VER VOTOS DA OPÇÃO (ESTILO WHATSAPP POLL DETAILS) */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
            {/* Cabeçalho do modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  Detalhes dos Votos • WhatsApp
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {formatDateDisplay(viewingEvent.date).fullText}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingEvent.title} ({viewingEvent.time || '19:00'})
                </p>
              </div>
              <button
                onClick={() => setViewingVotesEventId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com rolagem */}
            <div className="overflow-y-auto flex-1 py-4 space-y-5">
              {/* Quem confirmou (Votos SIM) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Confirmaram Presença ({getConfirmedMembersForEvent(viewingEvent).length})
                  </span>
                </div>

                {getConfirmedMembersForEvent(viewingEvent).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
                    Nenhum integrante confirmou presença ainda para esta data.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {getConfirmedMembersForEvent(viewingEvent).map((m) => {
                      const isMinister = m.roles.includes(Role.MINISTER);
                      return (
                        <div key={m.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                              {m.photoUrl ? (
                                <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                m.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {m.name}
                                </span>
                                {isMinister && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                                    <Mic className="w-3 h-3 text-amber-500" />
                                    Ministro
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {m.roles.join(', ')}
                              </span>
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleMemberVoteByAdmin(viewingEvent.id, m.id)}
                              className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Remover voto deste integrante"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Integrantes que ainda não responderam */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                  Ainda não responderam ({
                    activeMembers.filter(m => !isMemberConfirmed(viewingEvent, m.id)).length
                  })
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {activeMembers
                    .filter(m => !isMemberConfirmed(viewingEvent, m.id))
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate mr-2">
                          {m.name}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleMemberVoteByAdmin(viewingEvent.id, m.id)}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0"
                          >
                            + Confirmar
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Rodapé do modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {isAdmin && (
                <button
                  onClick={() => handleGenerateScheduleFromEvent(viewingEvent)}
                  disabled={getConfirmedMembersForEvent(viewingEvent).length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar Escala deste Culto com os Confirmados
                </button>
              )}

              <button
                onClick={() => setViewingVotesEventId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELETOR DE INTEGRANTE (QUEM ESTÁ VOTANDO) */}
      {showMemberPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Quem está respondendo?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione seu nome para confirmar presença na enquete
                </p>
              </div>
              <button
                onClick={() => setShowMemberPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca de membro */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar seu nome..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Lista de membros */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {activeMembers
                .filter(m => m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                .map((m) => {
                  const isSelected = m.id === currentMember?.id;
                  const isMinister = m.roles.includes(Role.MINISTER);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMember(m.id)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            m.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-1.5">
                            {m.name}
                            {isMinister && (
                              <Mic className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200' : 'text-amber-500'}`} />
                            )}
                          </div>
                          <div className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {m.roles.join(', ')}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR DATA À ENQUETE (ADMIN) */}
      {showAddDateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ➕ Adicionar Data à Enquete
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crie uma nova data de culto para votação dos integrantes
                </p>
              </div>
              <button
                onClick={() => setShowAddDateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDateOption} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Data do Culto *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Título / Nome do Culto *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Culto de Domingo - Noite"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Culto Domingo Noite', 'Culto Domingo Manhã', 'Culto de Quinta', 'Ceia do Senhor'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormTitle(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 font-semibold"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Ensaio de som às 18h"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                >
                  Adicionar Opção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERADOR DE DOMINGOS DO MÊS (ADMIN) */}
      {showMonthGenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ⚡ Gerar Domingos do Mês
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adiciona todos os domingos do mês escolhido diretamente na enquete
                </p>
              </div>
              <button
                onClick={() => setShowMonthGenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Selecione o Mês e Ano
                </label>
                <input
                  type="month"
                  value={monthToGen}
                  onChange={(e) => setMonthToGen(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Culto Padrão
                </label>
                <input
                  type="text"
                  value={genServiceTitle}
                  onChange={(e) => setGenServiceTitle(e.target.value)}
                  placeholder="Culto de Domingo - Noite"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={genServiceTime}
                  onChange={(e) => setGenServiceTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMonthGenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSundays}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  Gerar Domingos na Enquete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
