import React, { useState, useMemo, useEffect } from 'react';
import { Member, Schedule, ScheduleAssignment, ViewType, Role, SongStatus } from '../types';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  UserCheck, 
  Piano, 
  Guitar, 
  Zap, 
  Music, 
  Drum, 
  Mic2,
  Wand2,
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

interface AutoSchedulesProps {
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  members: Member[];
  setView: (view: ViewType) => void;
  onSync: () => void;
  onSaveToCloud?: (payload?: any) => Promise<void>;
  isSyncing: boolean;
  isAdmin: boolean;
}

interface DraftSchedule {
  id: string;
  date: string;
  serviceType: string;
  availableMemberIds: string[];
}

interface GeneratedAssignment {
  role: string;
  memberId: string;
}

interface GeneratedSchedule {
  id: string;
  date: string;
  serviceType: string;
  assignments: GeneratedAssignment[];
  availableMemberIds: string[]; // carried over for adjustments
}

export const AutoSchedules: React.FC<AutoSchedulesProps> = ({
  schedules,
  setSchedules,
  members,
  setView,
  onSync,
  onSaveToCloud,
  isSyncing,
  isAdmin
}) => {
  const [exportSuccessToast, setExportSuccessToast] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const year = nextMonth.getFullYear();
    const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [drafts, setDrafts] = useState<DraftSchedule[]>([]);
  const [generated, setGenerated] = useState<GeneratedSchedule[]>([]);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [availabilityRoleFilter, setAvailabilityRoleFilter] = useState<string>('all');
  
  // Generation Settings
  const [requirements, setRequirements] = useState({
    leader: true,
    vocalsCount: 2,
    keys: true,
    guitar: true,
    electricGuitar: true,
    bass: true,
    drums: true,
  });

  // Helper inside Member to get standard abbreviations of roles for badges
  const getMemberRolesLabel = (m: Member) => {
    const labels: string[] = [];
    if (m.roles.includes(Role.VOCAL)) labels.push('🎙️');
    if (m.roles.includes(Role.KEYS)) labels.push('🎹');
    if (m.roles.includes(Role.GUITAR)) labels.push('🎸');
    if (m.roles.includes(Role.BASS)) labels.push('🎸(B)');
    if (m.roles.includes(Role.DRUMS)) labels.push('🥁');
    return labels.join(' ');
  };

  const activeMembers = useMemo(() => {
    return (members || []).filter(m => m.isActive);
  }, [members]);

  // Handle month generation
  const handleGenerateMonthDrafts = () => {
    if (!selectedMonth) return;
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    const datesForDrafts: { dateStr: string; serviceType: string }[] = [];
    const dateCursor = new Date(year, month, 1);

    while (dateCursor.getMonth() === month) {
      const dayOfWeek = dateCursor.getDay(); // 0 = Sunday, 3 = Wednesday
      const day = String(dateCursor.getDate()).padStart(2, '0');
      const formatMonth = String(dateCursor.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dateCursor.getFullYear()}-${formatMonth}-${day}`;

      if (dayOfWeek === 0) { // Sunday
        datesForDrafts.push({ dateStr, serviceType: 'Domingo (Noite)' });
      } else if (dayOfWeek === 3) { // Wednesday
        datesForDrafts.push({ dateStr, serviceType: 'Quarta-feira' });
      }
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    const defaultMemberIds = activeMembers.map(m => m.id);

    const generatedDrafts: DraftSchedule[] = datesForDrafts.map((d, index) => ({
      id: `draft-${Date.now()}-${index}`,
      date: d.dateStr,
      serviceType: d.serviceType,
      availableMemberIds: [...defaultMemberIds]
    }));

    setDrafts(generatedDrafts);
    setGenerated([]);
    if (generatedDrafts.length > 0) {
      setExpandedDraftId(generatedDrafts[0].id);
    }
  };

  // Add individual draft
  const handleAddCustomDraft = () => {
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${monthStr}-${dayStr}`;

    const newDraft: DraftSchedule = {
      id: `draft-${Date.now()}`,
      date: dateStr,
      serviceType: 'Domingo/semana',
      availableMemberIds: activeMembers.map(m => m.id)
    };

    setDrafts(prev => [...prev, newDraft]);
    setExpandedDraftId(newDraft.id);
  };

  // Remove individual draft
  const handleRemoveDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    if (expandedDraftId === id) {
      setExpandedDraftId(null);
    }
  };

  // Update draft date/type
  const handleUpdateDraft = (id: string, field: 'date' | 'serviceType', value: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // Toggle availability of a member in a draft
  const handleToggleMemberAvailability = (draftId: string, memberId: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id !== draftId) return d;
      const isAvailable = d.availableMemberIds.includes(memberId);
      const newAvailable = isAvailable
        ? d.availableMemberIds.filter(id => id !== memberId)
        : [...d.availableMemberIds, memberId];
      return { ...d, availableMemberIds: newAvailable };
    }));
  };

  // Batch select/deselect on a draft
  const handleSetAllAvailability = (draftId: string, available: boolean) => {
    setDrafts(prev => prev.map(d => {
      if (d.id !== draftId) return d;
      
      const filteredForChange = activeMembers.filter(m => {
        if (availabilityRoleFilter === 'all') return true;
        if (availabilityRoleFilter === Role.OTHER) {
          return m.roles.length === 0 || m.roles.includes(Role.OTHER);
        }
        return m.roles.includes(availabilityRoleFilter as Role);
      });
      const idsForChange = filteredForChange.map(m => m.id);

      let newAvailable: string[];
      if (available) {
        newAvailable = Array.from(new Set([...d.availableMemberIds, ...idsForChange]));
      } else {
        newAvailable = d.availableMemberIds.filter(id => !idsForChange.includes(id));
      }

      return {
        ...d,
        availableMemberIds: newAvailable
      };
    }));
  };

  // Run the automatic generation algorithm!
  const handleRunAutoScheduler = () => {
    if (drafts.length === 0) return;

    // Track participation counts during draft allocation
    const participationCounts: Record<string, number> = {};
    activeMembers.forEach(m => {
      participationCounts[m.id] = 0;
    });

    const outputSchedules: GeneratedSchedule[] = [];

    // Sort drafts from earliest to latest to make scheduling logical
    const sortedDrafts = [...drafts].sort((a, b) => a.date.localeCompare(b.date));

    sortedDrafts.forEach(draft => {
      const availableIds = draft.availableMemberIds;
      const filledAssignments: GeneratedAssignment[] = [];
      const assignedOnThisDate = new Set<string>();

      // Local helper to pick a member for a role
      const assignRole = (roleName: string, roleValidators: Role[]) => {
        // Filter candidates who are:
        // 1. Available on this date
        // 2. Not already assigned to another role today
        // 3. Match at least one of the roleValidators
        let candidates = activeMembers.filter(m => 
          availableIds.includes(m.id) &&
          !assignedOnThisDate.has(m.id) &&
          roleValidators.some(v => m.roles.includes(v))
        );

        if (candidates.length === 0) {
          // Fallback if strict validation fails (especially for Vocal/Leader)
          if (roleValidators.includes(Role.VOCAL)) {
            // Pick any available who isn't booked yet
            candidates = activeMembers.filter(m => 
              availableIds.includes(m.id) && 
              !assignedOnThisDate.has(m.id)
            );
          }
        }

        if (candidates.length === 0) return null;

        // Sort candidates primarily by participation counts (ascending)
        // to balance/distribute workload perfectly!
        candidates.sort((a, b) => {
          const countA = participationCounts[a.id] || 0;
          const countB = participationCounts[b.id] || 0;
          if (countA !== countB) return countA - countB;
          // Tie breaker: stable alphabetical sort
          return a.name.localeCompare(b.name);
        });

        const chosen = candidates[0];
        
        // Log assignment
        assignedOnThisDate.add(chosen.id);
        participationCounts[chosen.id] = (participationCounts[chosen.id] || 0) + 1;
        
        return chosen.id;
      };

      // 1. Assign Leader (Vocal Líder)
      if (requirements.leader) {
        const leaderId = assignRole('Vocal Líder', [Role.VOCAL]);
        if (leaderId) {
          filledAssignments.push({ role: 'Vocal Líder', memberId: leaderId });
        }
      }

      // 2. Assign Instrumentalists
      // Keys (Teclado)
      if (requirements.keys) {
        const id = assignRole('Teclado', [Role.KEYS]);
        if (id) filledAssignments.push({ role: 'Teclado', memberId: id });
      }

      // Violão
      if (requirements.guitar) {
        // GUITAR plays either Acoustic or Electric
        const id = assignRole('Violão', [Role.GUITAR]);
        if (id) filledAssignments.push({ role: 'Violão', memberId: id });
      }

      // Guitarra
      if (requirements.electricGuitar) {
        const id = assignRole('Guitarra', [Role.GUITAR]);
        if (id) filledAssignments.push({ role: 'Guitarra', memberId: id });
      }

      // Baixo
      if (requirements.bass) {
        const id = assignRole('Baixo', [Role.BASS]);
        if (id) filledAssignments.push({ role: 'Baixo', memberId: id });
      }

      // Bateria
      if (requirements.drums) {
        const id = assignRole('Bateria', [Role.DRUMS]);
        if (id) filledAssignments.push({ role: 'Bateria', memberId: id });
      }

      // 3. Assign Vocals (Backing)
      const targetVocals = requirements.vocalsCount;
      for (let i = 0; i < targetVocals; i++) {
        const vocalId = assignRole('Vocal', [Role.VOCAL]);
        if (vocalId) {
          filledAssignments.push({ role: 'Vocal', memberId: vocalId });
        }
      }

      outputSchedules.push({
        id: draft.id,
        date: draft.date,
        serviceType: draft.serviceType,
        assignments: filledAssignments,
        availableMemberIds: [...availableIds]
      });
    });

    setGenerated(outputSchedules);
  };

  // Adjust preview manually
  const handleUpdateAssignmentPrv = (scheduleId: string, roleName: string, memberId: string) => {
    setGenerated(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      
      // Update or create assignment
      const exists = s.assignments.some(a => a.role === roleName);
      let newAssignments = [];
      
      if (memberId === '') {
        // Remove assignment
        newAssignments = s.assignments.filter(a => a.role !== roleName);
      } else if (exists) {
        newAssignments = s.assignments.map(a => a.role === roleName ? { ...a, memberId } : a);
      } else {
        newAssignments = [...s.assignments, { role: roleName, memberId }];
      }

      return {
        ...s,
        assignments: newAssignments
      };
    }));
  };

  // Export drafts to main schedules tab
  const handleExportToMainSchedules = () => {
    if (generated.length === 0) return;

    const realSchedules: Schedule[] = generated.map(gen => {
      // Gather all members assigned on this date
      const assignedIds = gen.assignments.map(a => a.memberId);
      const uniqueMemberIds = Array.from(new Set(assignedIds));

      const leaders = gen.assignments.filter(a => a.role === 'Vocal Líder').map(a => a.memberId);
      const backupVocals = gen.assignments.filter(a => a.role === 'Vocal').map(a => a.memberId);

      const finalAssignments: ScheduleAssignment[] = gen.assignments.map(a => ({
        role: a.role,
        memberId: a.memberId,
        confirmed: false,
        present: false
      }));

      return {
        id: gen.id.startsWith('draft-') ? gen.id.replace('draft-', 'sch-') : gen.id,
        date: gen.date,
        serviceType: gen.serviceType,
        members: uniqueMemberIds,
        assignments: finalAssignments,
        songs: [],
        leaderIds: leaders,
        vocalIds: backupVocals,
        confirmed: false
      };
    });

    const currentPrev = schedules || [];
    // Avoid raw duplicates targeting same dates or IDs
    const filteredPrev = currentPrev.filter(s => !realSchedules.some(rs => rs.date === s.date && rs.serviceType === s.serviceType));
    const updatedList = [...realSchedules, ...filteredPrev].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    setSchedules(updatedList);
    try {
      localStorage.setItem('louvor_schedules', JSON.stringify(updatedList));
    } catch (err) {
      console.error('Falha ao salvar no localStorage:', err);
    }

    // Save immediately to cloud if admin
    if (onSaveToCloud) {
      onSaveToCloud({ schedules: updatedList });
    }

    setExportSuccessToast(true);
    setTimeout(() => {
      setView('schedules');
    }, 1200);
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Vocal Líder': return <Mic2 className="text-emerald-500" size={16} />;
      case 'Vocal': return <Mic2 className="text-emerald-300" size={16} />;
      case 'Teclado': return <Piano className="text-indigo-400" size={16} />;
      case 'Violão': return <Guitar className="text-amber-500" size={16} />;
      case 'Guitarra': return <Zap className="text-amber-400" size={16} />;
      case 'Baixo': return <Music className="text-cyan-400" size={16} />;
      case 'Bateria': return <Drum className="text-rose-400" size={16} />;
      default: return <UserCheck className="text-slate-400" size={16} />;
    }
  };

  // Convert Role enum/string to labels
  const getRoleValidationEnum = (roleName: string): Role[] => {
    switch (roleName) {
      case 'Vocal Líder':
      case 'Vocal': 
        return [Role.VOCAL];
      case 'Teclado': 
        return [Role.KEYS];
      case 'Violão':
      case 'Guitarra': 
        return [Role.GUITAR];
      case 'Baixo': 
        return [Role.BASS];
      case 'Bateria': 
        return [Role.DRUMS];
      default: 
        return [];
    }
  };

  const formatLatinDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-tighter">Gerador de Escalas</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Escalamento automatizado e equilibrado</p>
        </div>
      </header>

      {/* STEP 1: Monthly config */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="text-emerald-600" size={18} /> Configure a escala do mês
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">MÊS DE AGENDAMENTO</label>
            <div className="flex gap-2">
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold"
              />
              <button 
                onClick={handleGenerateMonthDrafts}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md"
              >
                Gerar Datas
              </button>
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ou crie manualmente</span>
            <button 
              onClick={handleAddCustomDraft}
              className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Adicionar Data Avulsa
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtro de Requisitos</label>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.leader} onChange={(e) => setRequirements(r => ({ ...r, leader: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Líder
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.keys} onChange={(e) => setRequirements(r => ({ ...r, keys: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Teclado
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.guitar} onChange={(e) => setRequirements(r => ({ ...r, guitar: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Violão
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.electricGuitar} onChange={(e) => setRequirements(r => ({ ...r, electricGuitar: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Guitarra
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.bass} onChange={(e) => setRequirements(r => ({ ...r, bass: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Baixo
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={requirements.drums} onChange={(e) => setRequirements(r => ({ ...r, drums: e.target.checked }))} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Bateria
              </label>
              <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer col-span-2 mt-1 border-t pt-1 border-slate-200">
                <span className="text-[10px] text-slate-400">Backings:</span>
                <select 
                  value={requirements.vocalsCount}
                  onChange={(e) => setRequirements(r => ({ ...r, vocalsCount: parseInt(e.target.value) }))}
                  className="bg-transparent border-0 py-0 text-xs font-black text-emerald-600 focus:ring-0 outline-none"
                >
                  <option value={0}>Nenhum</option>
                  <option value={1}>1 Vocal</option>
                  <option value={2}>2 Vocais</option>
                  <option value={3}>3 Vocais</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Draft cards structure & Availability checks */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Previa das Datas ({drafts.length})</h4>
              <button 
                onClick={() => setDrafts([])}
                className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Limpar Tudo
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
              {drafts.map((draft) => {
                const isOpen = expandedDraftId === draft.id;
                
                return (
                  <div 
                    key={draft.id} 
                    className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/15' : 'border-slate-100 hover:border-slate-300 shadow-sm'}`}
                  >
                    {/* Header trigger */}
                    <div 
                      className="p-5 flex justify-between items-center cursor-pointer select-none"
                      onClick={() => setExpandedDraftId(isOpen ? null : draft.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
                          <CalendarIcon size={18} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{formatLatinDate(draft.date) || 'Sem data'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{draft.serviceType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-lg">
                          {draft.availableMemberIds.length} Disponíveis
                        </span>
                        <button 
                          onClick={() => handleRemoveDraft(draft.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          onClick={() => setExpandedDraftId(isOpen ? null : draft.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Availability selector panel */}
                    {isOpen && (
                      <div className="p-5 border-t border-slate-50 space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ajustar Data</label>
                            <input 
                              type="date" 
                              value={draft.date}
                              onChange={(e) => handleUpdateDraft(draft.id, 'date', e.target.value)}
                              className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ajustar Tipo/Período</label>
                            <select 
                              value={draft.serviceType}
                              onChange={(e) => handleUpdateDraft(draft.id, 'serviceType', e.target.value)}
                              className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold"
                            >
                              <option>Domingo/semana</option>
                              <option>Domingo (Noite)</option>
                              <option>Domingo (Manhã)</option>
                              <option>Quarta-feira</option>
                              <option>Evento Especial</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-50 pb-2">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">
                              Selecione Disponibilidade para o dia
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Grupo filtrado:</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleSetAllAvailability(draft.id, true)}
                                  className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-tight"
                                >
                                  Marcar Todos
                                </button>
                                <span className="text-[9px] text-slate-300">|</span>
                                <button 
                                  onClick={() => handleSetAllAvailability(draft.id, false)}
                                  className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-tight"
                                >
                                  Desmarcar Todos
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Role Select Filters */}
                          <div className="flex flex-wrap gap-1.5 py-1 border-b border-slate-50">
                            {[
                              { label: 'Todos', value: 'all' },
                              { label: '🎙️ Vocais', value: Role.VOCAL },
                              { label: '🎹 Teclado', value: Role.KEYS },
                              { label: '🎸 Violão/Guitarra', value: Role.GUITAR },
                              { label: '🎸 Baixo', value: Role.BASS },
                              { label: '🥁 Bateria', value: Role.DRUMS },
                              { label: 'Outros/Sem função', value: Role.OTHER }
                            ].map((roleOpt) => {
                              const isSel = availabilityRoleFilter === roleOpt.value;
                              return (
                                <button
                                  key={roleOpt.value}
                                  type="button"
                                  onClick={() => setAvailabilityRoleFilter(roleOpt.value)}
                                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all border ${
                                    isSel 
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  {roleOpt.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar p-1">
                            {activeMembers
                              .filter(m => {
                                if (availabilityRoleFilter === 'all') return true;
                                if (availabilityRoleFilter === Role.OTHER) {
                                  return m.roles.length === 0 || m.roles.includes(Role.OTHER);
                                }
                                return m.roles.includes(availabilityRoleFilter as Role);
                              })
                              .map(m => {
                                const isChecked = draft.availableMemberIds.includes(m.id);
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleToggleMemberAvailability(draft.id, m.id)}
                                    className={`px-3 py-2 rounded-xl text-left border-2 transition-all flex flex-col justify-center select-none ${isChecked ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                  >
                                    <span className="text-xs font-bold leading-tight">{m.name}</span>
                                    <span className="text-[9px] opacity-85 mt-0.5">{getMemberRolesLabel(m) || 'Outro'}</span>
                                  </button>
                                );
                              })}
                            {activeMembers.filter(m => {
                              if (availabilityRoleFilter === 'all') return true;
                              if (availabilityRoleFilter === Role.OTHER) {
                                return m.roles.length === 0 || m.roles.includes(Role.OTHER);
                              }
                              return m.roles.includes(availabilityRoleFilter as Role);
                            }).length === 0 && (
                              <div className="col-span-full py-8 text-center text-[10px] uppercase font-black text-slate-300 tracking-wider">
                                Nenhum integrante ativo com esta função.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleRunAutoScheduler}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/10 flex items-center gap-3 hover:scale-105"
              >
                <Wand2 size={18} /> Criar Escalas Automáticas
              </button>
            </div>
          </div>

          {/* RIGHT: Production outcome / Adjust generated scales */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Preview das Escalas Geradas</h4>
            
            {generated.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Equilíbrio Concluido</p>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">{generated.length} Escalas preparadas</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportToMainSchedules}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-md animate-bounce"
                  >
                    Exportar <ArrowRight size={14} />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 no-scrollbar">
                  {generated.map((gen, gIdx) => {
                    return (
                      <div key={gen.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500/70" />
                        
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <div>
                            <p className="font-extrabold text-slate-800 text-xs">{formatLatinDate(gen.date)}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{gen.serviceType}</p>
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                            Escala #{gIdx + 1}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {/* Role adjust fields */}
                          {['Vocal Líder', 'Teclado', 'Violão', 'Guitarra', 'Baixo', 'Bateria'].map((role) => {
                            // Check if this role was generated
                            const isReq = role === 'Vocal Líder' ? requirements.leader :
                                          role === 'Teclado' ? requirements.keys :
                                          role === 'Violão' ? requirements.guitar :
                                          role === 'Guitarra' ? requirements.electricGuitar :
                                          role === 'Baixo' ? requirements.bass :
                                          role === 'Bateria' ? requirements.drums : false;
                            
                            if (!isReq) return null;

                            const assigned = gen.assignments.find(a => a.role === role);
                            const currentMemberId = assigned ? assigned.memberId : '';
                            const validators = getRoleValidationEnum(role);
                            
                            // Find members available today who fit this role
                            const candidates = activeMembers.filter(m => 
                              gen.availableMemberIds.includes(m.id) &&
                              validators.some(v => m.roles.includes(v))
                            );

                            return (
                              <div key={role} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/50 rounded-xl px-2">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(role)}
                                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-tight">{role}</span>
                                </div>
                                <select
                                  value={currentMemberId}
                                  onChange={(e) => handleUpdateAssignmentPrv(gen.id, role, e.target.value)}
                                  className="text-xs font-extrabold text-slate-800 border-0 bg-transparent py-0 outline-none focus:ring-0 max-w-[150px] text-right"
                                >
                                  <option value="">-- A definir --</option>
                                  {candidates.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}

                          {/* Extra backings (vocals config) */}
                          {Array.from({ length: requirements.vocalsCount }).map((_, i) => {
                            const index = i;
                            const vocalsAssigned = gen.assignments.filter(a => a.role === 'Vocal');
                            const assigned = vocalsAssigned[index];
                            const currentMemberId = assigned ? assigned.memberId : '';
                            
                            // Find vocals available today
                            const candidates = activeMembers.filter(m => 
                              gen.availableMemberIds.includes(m.id) &&
                              m.roles.includes(Role.VOCAL)
                            );

                            return (
                              <div key={`backing-${index}`} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/50 rounded-xl px-2">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon('Vocal')}
                                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-tight">{`Backing Vocal ${index + 1}`}</span>
                                </div>
                                <select
                                  value={currentMemberId}
                                  onChange={(e) => {
                                    // Manually update backup position
                                    // Remove old position, map or add as needed
                                    const oldVocId = assigned ? assigned.memberId : null;
                                    let newAssigns = [...gen.assignments];
                                    
                                    if (oldVocId) {
                                      // Find specific item and update
                                      let foundCount = 0;
                                      newAssigns = newAssigns.map(as => {
                                        if (as.role === 'Vocal') {
                                          if (foundCount === index) {
                                            foundCount++;
                                            return { ...as, memberId: e.target.value };
                                          }
                                          foundCount++;
                                        }
                                        return as;
                                      }).filter(as => as.memberId !== '');
                                    } else {
                                      newAssigns.push({ role: 'Vocal', memberId: e.target.value });
                                    }
                                    
                                    handleUpdateAssignmentPrv(gen.id, 'Vocal-Rebuild', 'trigger-re-map'); // trigger update helper
                                    setGenerated(prev => prev.map(s => s.id === gen.id ? { ...s, assignments: newAssigns.filter(a => a.memberId !== '') } : s));
                                  }}
                                  className="text-xs font-extrabold text-slate-800 border-0 bg-transparent py-0 outline-none focus:ring-0 max-w-[150px] text-right"
                                >
                                  <option value="">-- A definir --</option>
                                  {candidates.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                <Wand2 size={36} className="mx-auto mb-4 text-emerald-100 animate-pulse" />
                Configure as datas e disponibilidades ao lado, depois clique em "Criar Escalas Automáticas" para ver o resultado equilibrado aqui.
              </div>
            )}
          </div>

        </div>
      )}

      {drafts.length === 0 && (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-16 text-center">
          <CalendarIcon size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum rascunho de data configurado</p>
          <p className="text-xs text-slate-300 uppercase tracking-widest mt-2">Escolha uma opção no painel de configuração para começar</p>
        </div>
      )}

      {exportSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300 border border-emerald-500/30">
          <CheckCircle2 size={28} className="text-emerald-300 flex-shrink-0" />
          <div>
            <p className="font-black text-sm uppercase tracking-wide">Escalas Salvas com Sucesso!</p>
            <p className="text-xs text-emerald-100 font-medium">As novas escalas foram salvas no app e sincronizadas. Redirecionando...</p>
          </div>
        </div>
      )}
    </div>
  );
};
