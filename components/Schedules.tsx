import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Schedule, Member, Song, ScheduleAssignment, ScheduleSong, SongStatus } from '../types';
import * as XLSX from 'xlsx';
import { 
  CalendarDays, 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  Music, 
  Trash2, 
  X, 
  Check, 
  Mic2, 
  Guitar, 
  Drum, 
  Piano,
  MessageSquare,
  Copy,
  RefreshCw,
  Zap,
  Edit2,
  Filter,
  Search,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Square,
  CheckSquare,
  CheckCircle2,
  Circle,
  UserCheck
} from 'lucide-react';

interface SchedulesProps {
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  members: Member[];
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  onSync: () => void;
  isSyncing: boolean;
  isAdmin: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const formatDateSafely = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getDayOfWeek = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
};

export const Schedules: React.FC<SchedulesProps> = ({ 
  schedules = [], 
  setSchedules, 
  members = [], 
  songs = [], 
  setSongs,
  onSync,
  isSyncing,
  isAdmin
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('Domingo/semana');
  const [observations, setObservations] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [monthCopyFeedback, setMonthCopyFeedback] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [leaderIds, setLeaderIds] = useState<string[]>([]);
  const [vocalIds, setVocalIds] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<Record<string, string>>({
    'Teclado': '',
    'Violão': '',
    'Guitarra': '',
    'Baixo': '',
    'Bateria': ''
  });

  const [tempSetlist, setTempSetlist] = useState<{title: string, key: string}[]>([{title: '', key: ''}]);

  const instrumentIcons: Record<string, any> = {
    'Teclado': Piano,
    'Violão': Guitar,
    'Guitarra': Zap,
    'Baixo': Music,
    'Bateria': Drum
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setActiveSuggestionIdx(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    (schedules || []).forEach(s => {
      if (s && s.date) {
        const [year, month] = s.date.split('-');
        months.add(`${year}-${month}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const list = selectedMonthFilter === 'all' 
      ? (schedules || []) 
      : (schedules || []).filter(s => s && s.date && s.date.startsWith(selectedMonthFilter));
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [schedules, selectedMonthFilter]);

  const formatMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`;
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getScheduleText = (sch: Schedule) => {
    const dateStr = formatDateSafely(sch.date);
    const dayName = getDayOfWeek(sch.date);
    const leaderList = (sch.leaderIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    const leaders = leaderList.length > 0 ? leaderList.join(', ') : 'A definir';
    const vocalList = (sch.vocalIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean);
    const vocals = vocalList.length > 0 ? vocalList.join(', ') : 'A definir';
    
    let text = `🗓️ *${dateStr}* - ${dayName} (${sch.serviceType})\n`;
    text += `🎤 Líder(es): ${leaders}\n`;
    text += `🗣️ Vocals: ${vocals}\n`;
    
    if (sch.observations) {
      text += `📝 Obs: ${sch.observations}\n`;
    }
    
    const instrumentRoles = ['Teclado', 'Violão', 'Guitarra', 'Baixo', 'Bateria'];
    const assignments = (sch.assignments || []).filter(a => instrumentRoles.includes(a.role));
    
    instrumentRoles.forEach(role => {
      const a = assignments.find(x => x.role === role);
      const member = members.find(m => m.id === a?.memberId);
      if (member) {
        let emoji = '🎸';
        if (role === 'Teclado') emoji = '🎹';
        if (role === 'Bateria') emoji = '🥁';
        text += `${emoji} ${role}: ${member.name}\n`;
      }
    });

    text += `🎶 *MÚSICAS:*\n`;
    if (sch.songs && sch.songs.length > 0) {
      sch.songs.forEach((songData, i) => {
        const sId = typeof songData === 'string' ? songData : songData.id;
        const sKey = typeof songData === 'string' ? '' : songData.key;
        const s = songs.find(x => x.id === sId);
        if (s) {
          const displayKey = sKey || s.key;
          text += `${i+1}. ${s.title}${displayKey ? ` (${displayKey})` : ''}\n`;
        }
      });
    } else {
      text += `A definir\n`;
    }
    return text;
  };

  const handleCopyMonthReport = async () => {
    let reportSchedules = [];
    
    if (isSelectionMode) {
      if (selectedIds.size === 0) {
        alert("Selecione ao menos uma escala para copiar.");
        return;
      }
      reportSchedules = filteredSchedules.filter(s => selectedIds.has(s.id));
    } else {
      if (filteredSchedules.length === 0) return;
      reportSchedules = filteredSchedules;
    }

    let title = "*ESCALAS DE LOUVOR* ⛪\n";
    if (selectedMonthFilter !== 'all' && !isSelectionMode) {
      title = `*ESCALAS DE ${formatMonthLabel(selectedMonthFilter).toUpperCase()}* ⛪\n`;
    }
    
    let fullReport = `${title}--------------------------\n\n`;
    
    reportSchedules.forEach((sch, idx) => {
      fullReport += getScheduleText(sch);
      if (idx < reportSchedules.length - 1) {
        fullReport += `\n--------------------------\n\n`;
      }
    });

    fullReport += `\n_Gerado pelo App Minist. Louvor Pibje_`;

    try {
      await navigator.clipboard.writeText(fullReport);
      setMonthCopyFeedback(true);
      setTimeout(() => {
        setMonthCopyFeedback(false);
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        }
      }, 3000);
    } catch (err) {
      console.error('Falha ao copiar relatório:', err);
    }
  };

  const handleExportExcel = () => {
    if (!exportMonth) {
      alert("Selecione um mês ou a opção de 'Todas as Escalas' para exportar.");
      return;
    }

    const schedulesToExport = exportMonth === 'all' 
      ? [...schedules].sort((a, b) => b.date.localeCompare(a.date))
      : schedules
          .filter(s => s.date.startsWith(exportMonth))
          .sort((a, b) => b.date.localeCompare(a.date));

    if (schedulesToExport.length === 0) {
      alert("Nenhuma escala encontrada.");
      return;
    }

    const data: any[][] = [];
    const headerRow = schedulesToExport.map(() => "ESCALA DE LOUVOR ⛪");
    data.push(headerRow);

    const dateRow = schedulesToExport.map(s => `🗓️ ${formatDateSafely(s.date)} - ${s.serviceType}`);
    data.push(dateRow);
    data.push(schedulesToExport.map(() => "")); 

    data.push(schedulesToExport.map(() => "EQUIPE:"));

    const roles = ['Líder', 'Vocals', 'Teclado', 'Violão', 'Guitarra', 'Baixo', 'Bateria'];
    roles.forEach(role => {
      const row = schedulesToExport.map(s => {
        if (role === 'Líder') {
          const names = (s.leaderIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ');
          return `🎤 Líder(es): ${names || '-'}`;
        }
        if (role === 'Vocals') {
          const names = (s.vocalIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ');
          return `👥 Vocals: ${names || '-'}`;
        }
        const assignment = (s.assignments || []).find(a => a.role === role);
        const name = members.find(m => m.id === assignment?.memberId)?.name || '-';
        let emoji = '🎸';
        if (role === 'Teclado') emoji = '🎹';
        if (role === 'Bateria') emoji = '🥁';
        return `${emoji} ${role}: ${name}`;
      });
      data.push(row);
    });

    data.push(schedulesToExport.map(() => "")); 

    data.push(schedulesToExport.map(() => "🎶 MÚSICAS:"));

    const maxSongs = Math.max(...schedulesToExport.map(s => s.songs?.length || 0), 1);
    for (let i = 0; i < maxSongs; i++) {
      const row = schedulesToExport.map(s => {
        const songData = s.songs?.[i];
        if (!songData) return i === 0 ? "A definir..." : "";
        
        const sId = typeof songData === 'string' ? songData : songData.id;
        const sKey = typeof songData === 'string' ? '' : songData.key;
        
        const song = songs.find(x => x.id === sId);
        const displayKey = sKey || song?.key;
        return `- ${song?.title || 'Música'}${displayKey ? ` (${displayKey})` : ''}`;
      });
      data.push(row);
    }

    // Add Observations to Excel
    data.push(schedulesToExport.map(() => ""));
    data.push(schedulesToExport.map(() => "📝 OBSERVAÇÕES:"));
    data.push(schedulesToExport.map(s => s.observations || "-"));

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wscols = schedulesToExport.map(() => ({ wch: 45 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Escalas");

    const fileName = exportMonth === 'all' ? `Escalas_Completo.xlsx` : `Escalas_${exportMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
  };

  const handleEdit = (sch: Schedule) => {
    if (!isAdmin) return;
    setEditingId(sch.id);
    setDate(sch.date);
    setServiceType(sch.serviceType);
    setObservations(sch.observations || '');
    setLeaderIds(sch.leaderIds || []);
    setVocalIds(sch.vocalIds || []);
    
    const newInstruments: Record<string, string> = {
      'Teclado': '', 'Violão': '', 'Guitarra': '', 'Baixo': '', 'Bateria': ''
    };
    sch.assignments.forEach(a => {
      if (newInstruments.hasOwnProperty(a.role)) {
        newInstruments[a.role] = a.memberId;
      }
    });
    setInstruments(newInstruments);

    const currentSongs = (sch.songs || []).map(songData => {
      const sId = typeof songData === 'string' ? songData : songData.id;
      const sKey = typeof songData === 'string' ? '' : songData.key;
      const song = songs.find(s => s.id === sId);
      return { title: song?.title || '', key: sKey || song?.key || '' };
    });
    setTempSetlist(currentSongs.length > 0 ? currentSongs : [{title: '', key: ''}]);
    
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLeader = (id: string) => {
    setLeaderIds(prev => {
        const isAlreadySelected = prev.includes(id);
        if (isAlreadySelected) return prev.filter(x => x !== id);
        setVocalIds(v => v.filter(vId => vId !== id));
        return [...prev, id];
    });
  };

  const toggleVocal = (id: string) => {
    setVocalIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSetlistItem = () => setTempSetlist([...tempSetlist, { title: '', key: '' }]);
  const removeSetlistItem = (index: number) => setTempSetlist(tempSetlist.filter((_, i) => i !== index));
  
  const updateSetlistItem = (index: number, field: 'title' | 'key', value: string) => {
    const newList = [...tempSetlist];
    newList[index][field] = value;
    setTempSetlist(newList);
    
    if (field === 'title' && value.length > 0) {
      setActiveSuggestionIdx(index);
    } else if (field === 'title' && value.length === 0) {
      setActiveSuggestionIdx(null);
    }
  };

  const selectSongFromSuggestion = (index: number, song: Song) => {
    const newList = [...tempSetlist];
    newList[index].title = song.title;
    newList[index].key = song.key || '';
    setTempSetlist(newList);
    setActiveSuggestionIdx(null);
  };

  const handleCopyText = async (sch: Schedule) => {
    const text = getScheduleText(sch);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(sch.id);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const toggleSongConfirm = (scheduleId: string, songId: string) => {
    if (!isAdmin) return;
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const updatedSongs = (s.songs || []).map(song => 
        song.id === songId ? { ...song, confirmed: !song.confirmed } : song
      );
      return { ...s, songs: updatedSongs };
    }));
  };

  const toggleAssignmentConfirm = (scheduleId: string, memberId: string, role: string) => {
    if (!isAdmin) return;
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const updatedAssignments = (s.assignments || []).map(a => 
        (a.memberId === memberId && a.role === role) ? { ...a, confirmed: !a.confirmed } : a
      );
      return { ...s, assignments: updatedAssignments };
    }));
  };

  const toggleAttendance = (scheduleId: string, memberId: string, role: string) => {
    if (!isAdmin) return;
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const updatedAssignments = (s.assignments || []).map(a => 
        (a.memberId === memberId && a.role === role) ? { ...a, present: !a.present } : a
      );
      return { ...s, assignments: updatedAssignments, attendanceMarked: true };
    }));
  };

  const calculateProgress = (sch: Schedule) => {
    const totalItems = (sch.songs?.length || 0) + (sch.assignments?.length || 0);
    if (totalItems === 0) return 0;
    
    const confirmedSongs = (sch.songs || []).filter(s => s.confirmed).length;
    const confirmedAssignments = (sch.assignments || []).filter(a => a.confirmed || a.present).length;
    
    return Math.round(((confirmedSongs + confirmedAssignments) / totalItems) * 100);
  };

  const isDatePassed = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const scheduleDate = new Date(year, month - 1, day);
    return scheduleDate <= today;
  };

  const saveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!date || leaderIds.length === 0) {
      alert("Por favor, preencha a data e selecione ao menos um Líder.");
      return;
    }

    const finalSongs: ScheduleSong[] = [];
    const newSongsToRegister: Song[] = [];

    tempSetlist.forEach(item => {
      if (!item.title || !item.title.trim()) return;
      
      const searchTitle = item.title.toLowerCase().trim();
      const existingSong = songs.find(s => s.title && s.title.toLowerCase() === searchTitle);
      
      if (existingSong) {
        const existingSchedule = schedules.find(s => s.id === editingId);
        finalSongs.push({ 
          id: existingSong.id, 
          key: (item.key || existingSong.key || '').toUpperCase(),
          confirmed: editingId ? ((existingSchedule?.songs || []).find(sg => sg.id === existingSong.id)?.confirmed || false) : false
        });
      } else {
        const newId = generateShortId();
        const newSong: Song = { 
          id: newId, 
          title: item.title.trim(), 
          artist: 'Manual', 
          key: (item.key || '').toUpperCase(),
          status: SongStatus.PENDING,
          youtubeUrl: ''
        };
        newSongsToRegister.push(newSong);
        finalSongs.push({ 
          id: newId, 
          key: (item.key || '').toUpperCase(),
          confirmed: false
        });
      }
    });

    if (newSongsToRegister.length > 0) {
      setSongs(prev => [...prev, ...newSongsToRegister]);
    }

    const filteredVocals = vocalIds.filter(vId => !leaderIds.includes(vId));

    const existingSchedule = editingId ? schedules.find(s => s.id === editingId) : null;
    const finalAssignments: ScheduleAssignment[] = [
      ...leaderIds.map(id => ({ 
        role: 'Vocal Líder', 
        memberId: id,
        confirmed: editingId ? ((existingSchedule?.assignments || []).find(a => a.memberId === id && a.role === 'Vocal Líder')?.confirmed || false) : false
      })),
      ...filteredVocals.map(id => ({ 
        role: 'Vocal', 
        memberId: id,
        confirmed: editingId ? ((existingSchedule?.assignments || []).find(a => a.memberId === id && a.role === 'Vocal')?.confirmed || false) : false
      })),
      ...Object.entries(instruments).filter(([_, id]) => id !== '').map(([role, id]) => ({ 
        role, 
        memberId: id,
        confirmed: editingId ? ((existingSchedule?.assignments || []).find(a => a.memberId === id && a.role === role)?.confirmed || false) : false
      }))
    ];

    const allUniqueMemberIds = Array.from(new Set([
        ...leaderIds, 
        ...filteredVocals, 
        ...Object.values(instruments).filter(id => id !== '')
    ]));

    const scheduleData: Schedule = {
      id: editingId || generateShortId(),
      date,
      serviceType,
      members: allUniqueMemberIds,
      assignments: finalAssignments,
      songs: finalSongs,
      leaderIds,
      vocalIds: filteredVocals,
      confirmed: editingId ? schedules.find(s => s.id === editingId)?.confirmed : false,
      observations
    };

    if (editingId) {
      setSchedules(prev => prev.map(s => s.id === editingId ? scheduleData : s));
    } else {
      setSchedules(prev => [scheduleData, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    }

    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setLeaderIds([]);
    setVocalIds([]);
    setInstruments({ 'Teclado': '', 'Violão': '', 'Guitarra': '', 'Baixo': '', 'Bateria': '' });
    setTempSetlist([{title: '', key: ''}]);
    setDate('');
    setObservations('');
    setActiveSuggestionIdx(null);
  };

  const removeSchedule = (id: string) => {
    if (!isAdmin) return;
    if (confirm('Remover esta escala?')) setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Escalas</h2>
          <p className="text-slate-500 font-medium">Gestão de louvor da igreja.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isSelectionMode ? (
            <div className="flex gap-2 w-full md:w-auto">
               <button 
                onClick={handleCopyMonthReport}
                className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                {monthCopyFeedback ? <Check size={18} /> : <MessageCircle size={18} />}
                COPIAR {selectedIds.size} SELECIONADAS
              </button>
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                CANCELAR
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSelectionMode(true)}
              className="flex-1 md:flex-none p-3 bg-white text-emerald-600 border border-slate-200 rounded-2xl hover:bg-emerald-50 transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              title="Selecionar escalas específicas para relatório"
            >
              <CheckSquare size={18} /> Selecionar Escalas
            </button>
          )}

          {!isSelectionMode && (
            <>
              <button 
                onClick={handleCopyMonthReport}
                disabled={filteredSchedules.length === 0}
                className={`flex-1 md:flex-none p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest border ${monthCopyFeedback ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50'}`}
                title="Copiar todas as escalas visíveis para WhatsApp"
              >
                <MessageCircle size={18} /> Relatório Completo
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="p-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
                title="Exportar para Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
              <button 
                onClick={onSync}
                disabled={isSyncing}
                className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all disabled:opacity-50"
                title="Atualizar dados da nuvem"
              >
                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => {
                    if (isAdding) resetForm();
                    setIsAdding(!isAdding);
                  }}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg text-[10px] uppercase tracking-widest"
                >
                  {isAdding ? <X size={20} /> : <Plus size={20} />}
                  {isAdding ? 'CANCELAR' : 'NOVA ESCALA'}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Export Modal (remains same) */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" /> Exportar Excel
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Escolha o período para gerar o relatório lado a lado conforme referência.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Selecione o Período</label>
                <select 
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl py-4 px-6 outline-none font-bold"
                >
                  <option value="">Escolha um período...</option>
                  <option value="all">TODAS AS ESCALAS (GERAL)</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{formatMonthLabel(month).toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={handleExportExcel}
                  disabled={!exportMonth}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} /> GERAR EXCEL
                </button>
                <button onClick={() => setShowExportModal(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters (remains same) */}
      {!isAdding && schedules.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-300 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <Filter size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtrar por Mês</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedMonthFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 whitespace-nowrap ${selectedMonthFilter === 'all' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-200'}`}>TODAS</button>
            {availableMonths.map(month => (
              <button key={month} onClick={() => setSelectedMonthFilter(month)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 whitespace-nowrap ${selectedMonthFilter === month ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-200'}`}>{formatMonthLabel(month).toUpperCase()}</button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form (remains same) */}
      {isAdding && isAdmin && (
        <form onSubmit={saveSchedule} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tighter">{editingId ? 'Editar Escala' : 'Criar Nova Escala'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">DATA DO EVENTO</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">PERÍODO / TIPO</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold">
                <option>Domingo/semana</option>
                <option>Domingo (Noite)</option>
                <option>Domingo (Manhã)</option>
                <option>Quarta-feira</option>
                <option>Evento Especial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase text-xs tracking-widest"><Mic2 size={16} className="text-emerald-600" /> Equipe Ministerial</h4>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-black text-emerald-700 mb-2 uppercase">🎤 LÍDER(ES) / MINISTRO(S)</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {(members || []).filter(m => m.isActive).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleLeader(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${leaderIds.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">🗣️ VOCALS (BACKING) - Exceto Ministros</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {(members || []).filter(m => m.isActive && !leaderIds.includes(m.id)).map(m => (
                      <button key={m.id} type="button" onClick={() => toggleVocal(m.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${vocalIds.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{m.name}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(instruments).map(role => {
                    const Icon = instrumentIcons[role] || Music;
                    return (
                      <div key={role} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Icon size={16} /><label className="block text-[10px] font-black uppercase tracking-widest">{role}</label>
                        </div>
                        <select value={instruments[role]} onChange={(e) => setInstruments(prev => ({...prev, [role]: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500">
                          <option value="">Selecione...</option>
                          {(members || []).filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase text-xs tracking-widest"><Music size={16} className="text-emerald-600" /> Repertório</h4>
              <div className="space-y-3">
                {tempSetlist.map((item, idx) => {
                  const filteredSongs = songs.filter(s => item.title && s.title.toLowerCase().includes(item.title.toLowerCase())).slice(0, 5);
                  return (
                    <div key={idx} className="flex gap-2 items-start relative">
                      <div className="flex-1 relative">
                        <input type="text" placeholder="Nome da Música" value={item.title} onChange={(e) => updateSetlistItem(idx, 'title', e.target.value)} onFocus={() => item.title && setActiveSuggestionIdx(idx)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-emerald-500" />
                        {activeSuggestionIdx === idx && filteredSongs.length > 0 && (
                          <div ref={suggestionRef} className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {filteredSongs.map((s) => (
                              <button key={s.id} type="button" onClick={() => selectSongFromSuggestion(idx, s)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors border-b last:border-0 border-slate-50 group">
                                <div className="text-left">
                                  <p className="text-sm font-black text-slate-800 group-hover:text-emerald-700">{s.title}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{s.artist !== 'Manual' ? s.artist : 'Repertório'}</p>
                                </div>
                                <div className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-lg">{s.key}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input type="text" placeholder="Tom" value={item.key} onChange={(e) => updateSetlistItem(idx, 'key', e.target.value)} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 font-black text-center text-xs uppercase text-emerald-600 outline-none focus:border-emerald-500" />
                      <button type="button" onClick={() => removeSetlistItem(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
                <button type="button" onClick={addSetlistItem} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-emerald-300 hover:text-emerald-500 transition-all">+ ADICIONAR MÚSICA</button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">OBSERVAÇÕES ADICIONAIS</label>
            <textarea 
              value={observations} 
              onChange={(e) => setObservations(e.target.value)} 
              placeholder="Ex: Trazer instrumentos extras, ensaio antes do culto, etc."
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold min-h-[100px] resize-none"
            />
          </div>

          <div className="pt-6 border-t flex justify-end gap-4">
            <button type="button" onClick={() => { setIsAdding(false); resetForm(); }} className="px-6 py-3 font-bold text-slate-400">CANCELAR</button>
            <button type="submit" className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all">{editingId ? 'ATUALIZAR ESCALA' : 'SALVAR ESCALA'}</button>
          </div>
        </form>
      )}

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {filteredSchedules.map((sch) => {
          const dateFormatted = formatDateSafely(sch.date);
          const dayName = getDayOfWeek(sch.date);
          const leaderNames = (sch.leaderIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean);
          const vocalNames = (sch.vocalIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean);
          const isCopied = copyFeedback === sch.id;
          const isSelected = selectedIds.has(sch.id);
          const progress = calculateProgress(sch);
          const isPassed = isDatePassed(sch.date);

          return (
            <div 
              key={sch.id} 
              onClick={() => isSelectionMode && toggleSelection(sch.id)}
              className={`
                bg-[#0b3d2e] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden flex flex-col group border-4 transition-all
                ${isSelectionMode ? 'cursor-pointer hover:border-emerald-400' : 'border-white/10 hover:border-emerald-500/30'}
                ${isSelected ? 'border-emerald-500 scale-[0.98]' : ''}
                ${progress === 100 ? 'ring-4 ring-emerald-500/20' : ''}
              `}
            >
              {progress === 100 && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-4 rounded-bl-[2rem] z-20 shadow-lg animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 size={24} />
                </div>
              )}

              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              {isSelectionMode && (
                <div className={`absolute top-4 left-4 z-10 p-1.5 rounded-lg border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/10 border-white/20 text-white/40'}`}>
                  {isSelected ? <Check size={20} /> : <Square size={20} />}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-3 transition-transform ${isSelectionMode ? 'translate-x-10' : ''}`}>
                  <div className="bg-white/10 p-2.5 rounded-xl"><CalendarIcon size={20} className="text-emerald-400" /></div>
                  <div>
                    <h3 className="font-black text-lg leading-tight uppercase tracking-tight">Escala de Louvor ⛪</h3>
                    <p className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest">{dateFormatted} - {dayName} ({sch.serviceType})</p>
                  </div>
                </div>
                {!isSelectionMode && (
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleCopyText(sch); }} className={`p-2 rounded-lg transition-all flex items-center gap-1 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-emerald-500 text-white'}`} title="Copiar para WhatsApp">{isCopied ? <Check size={16} /> : <Copy size={16} />}{isCopied && <span className="text-[10px] font-black uppercase">Copiado!</span>}</button>
                    {isAdmin && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(sch); }} className="p-2 bg-white/10 rounded-lg hover:bg-blue-500 transition-all text-white" title="Editar Escala"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); removeSchedule(sch.id); }} className="p-2 bg-white/10 rounded-lg hover:bg-red-500 transition-all text-white"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mt-4 flex-1">
                {/* Progress Percentage */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">Conclusão</span>
                  <span className="text-sm font-black text-emerald-400">{progress}%</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Mic2 size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium">
                      <strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">Líder(es):</strong> 
                      {leaderNames.join(', ') || 'A definir'}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      {(sch.leaderIds || []).map(id => {
                        const assignment = (sch.assignments || []).find(a => a.memberId === id && a.role === 'Vocal Líder');
                        const isConfirmed = assignment?.confirmed || assignment?.present;
                        return (
                          <button 
                            key={id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (isPassed) {
                                toggleAttendance(sch.id, id, 'Vocal Líder');
                              } else {
                                toggleAssignmentConfirm(sch.id, id, 'Vocal Líder');
                              }
                            }}
                            className={`p-1 transition-all ${isConfirmed ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                            title={`Confirmar/Marcar presença de ${members.find(m => m.id === id)?.name}`}
                          >
                            <UserCheck size={14} strokeWidth={3} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-emerald-400 shrink-0 mt-1" />
                    <span className="text-sm font-medium">
                      <strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">Vocals:</strong> 
                      {vocalNames.join(', ') || 'A definir'}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-wrap justify-end max-w-[100px]">
                      {sch.vocalIds?.map(id => {
                        const assignment = (sch.assignments || []).find(a => a.memberId === id && a.role === 'Vocal');
                        const isConfirmed = assignment?.confirmed || assignment?.present;
                        return (
                          <button 
                            key={id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (isPassed) {
                                toggleAttendance(sch.id, id, 'Vocal');
                              } else {
                                toggleAssignmentConfirm(sch.id, id, 'Vocal');
                              }
                            }}
                            className={`p-1 transition-all ${isConfirmed ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                            title={`Confirmar/Marcar presença de ${members.find(m => m.id === id)?.name}`}
                          >
                            <UserCheck size={14} strokeWidth={3} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {(sch.assignments || []).filter(a => !['Vocal Líder', 'Vocal'].includes(a.role)).map((a, i) => {
                  const m = members.find(x => x.id === a.memberId);
                  const Icon = instrumentIcons[a.role] || Music;
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-sm font-medium">
                          <strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">{a.role}:</strong> 
                          {m?.name || 'A definir'}
                        </span>
                      </div>
                      {isAdmin && a.memberId && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isPassed) {
                              toggleAttendance(sch.id, a.memberId, a.role);
                            } else {
                              toggleAssignmentConfirm(sch.id, a.memberId, a.role);
                            }
                          }}
                          className={`p-1 transition-all ${a.confirmed || a.present ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                          title={`Confirmar/Marcar presença de ${m?.name}`}
                        >
                          <UserCheck size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {sch.observations && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-emerald-400 shrink-0 mt-1" />
                    <div className="space-y-1">
                      <strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">Observações:</strong>
                      <p className="text-sm text-emerald-50/80 leading-relaxed italic">
                        "{sch.observations}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-white/5">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3"><Music size={14} /> Músicas do Dia</h4>
                <div className="space-y-1.5">
                  {(sch.songs || []).length > 0 ? (sch.songs || []).map((songData, i) => {
                    const sId = typeof songData === 'string' ? songData : songData.id;
                    const sKey = typeof songData === 'string' ? '' : songData.key;
                    const s = songs.find(x => x.id === sId);
                    const displayKey = sKey || s?.key;
                    const isConfirmed = typeof songData !== 'string' && songData.confirmed;

                    return (
                      <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl text-xs group/song">
                        <div className="flex items-center gap-2">
                          <span className="font-bold opacity-90">{i+1}. {s?.title || 'Música Desconhecida'}</span>
                          {displayKey && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase">{displayKey}</span>}
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleSongConfirm(sch.id, sId); }}
                            className={`p-1 transition-all ${isConfirmed ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                            title="Confirmar execução da música"
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  }) : (<p className="text-xs text-white/30 italic">A definir</p>)}
                </div>
              </div>

                  {isAdmin && isPassed && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const allPresent = (sch.assignments || []).every(a => a.present);
                    setSchedules(prev => prev.map(s => {
                      if (s.id !== sch.id) return s;
                      return {
                        ...s,
                        attendanceMarked: !allPresent,
                        assignments: (s.assignments || []).map(a => ({ ...a, present: !allPresent }))
                      };
                    }));
                  }}
                  className={`mt-6 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${sch.attendanceMarked ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'}`}
                >
                  {sch.attendanceMarked ? <CheckCircle2 size={18} /> : <UserCheck size={18} />}
                  {sch.attendanceMarked ? 'Presença Confirmada' : 'Marcar Todos como Presentes'}
                </button>
              )}
            </div>
          );
        })}
        {filteredSchedules.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <CalendarIcon size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma escala para este período</p>
          </div>
        )}
      </div>
    </div>
  );
};