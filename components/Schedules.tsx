
import React, { useState } from 'react';
import { Schedule, Member, Song, ScheduleAssignment } from '../types';
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
  Share2,
  RefreshCw
} from 'lucide-react';

interface SchedulesProps {
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  members: Member[];
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  onSync: () => void;
  isSyncing: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Schedules: React.FC<SchedulesProps> = ({ 
  schedules = [], 
  setSchedules, 
  members = [], 
  songs = [], 
  setSongs,
  onSync,
  isSyncing
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('Domingo (Noite)');
  
  const [leaderId, setLeaderId] = useState('');
  const [vocalIds, setVocalIds] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<Record<string, string>>({
    'Teclado': '',
    'Violão': '',
    'Baixo': '',
    'Bateria': ''
  });

  const [tempSetlist, setTempSetlist] = useState<{title: string, key: string}[]>([{title: '', key: ''}]);

  const toggleVocal = (id: string) => {
    setVocalIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSetlistItem = () => setTempSetlist([...tempSetlist, { title: '', key: '' }]);
  const removeSetlistItem = (index: number) => setTempSetlist(tempSetlist.filter((_, i) => i !== index));
  const updateSetlistItem = (index: number, field: 'title' | 'key', value: string) => {
    const newList = [...tempSetlist];
    newList[index][field] = value;
    setTempSetlist(newList);
  };

  const handleShare = (sch: Schedule) => {
    const d = new Date(sch.date);
    const dateStr = d.toLocaleDateString('pt-BR');
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDay = dayName ? dayName.charAt(0).toUpperCase() + dayName.slice(1) : '';
    
    const leader = members.find(m => m.id === sch.leaderId)?.name || 'A definir';
    const vocals = (sch.vocalIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ') || 'A definir';
    
    let text = `*ESCALA DE LOUVOR* 🕊️\n`;
    text += `📅 *${dateStr}* - ${formattedDay} (${sch.serviceType})\n\n`;
    text += `🎤 Líder: ${leader}\n`;
    text += `🗣️ Vocals: ${vocals}\n`;
    
    (sch.assignments || []).filter(a => !['Vocal Líder', 'Vocal'].includes(a.role)).forEach(a => {
      const name = members.find(m => m.id === a.memberId)?.name || 'A definir';
      text += `${a.role === 'Teclado' ? '🎹' : '🎸'} ${a.role}: ${name}\n`;
    });

    text += `\n🎶 *MÚSICAS:*\n`;
    if (sch.songs && sch.songs.length > 0) {
      sch.songs.forEach((sId, i) => {
        const s = songs.find(x => x.id === sId);
        if (s) {
          text += `${i+1}. ${s.title}${s.key ? ` (${s.key})` : ''}\n`;
        }
      });
    } else {
      text += `A definir`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const addSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !leaderId) {
      alert("Por favor, preencha a data e o Líder.");
      return;
    }

    const finalSongIds: string[] = [];
    tempSetlist.forEach(item => {
      if (!item.title || !item.title.trim()) return;
      
      const searchTitle = item.title.toLowerCase().trim();
      const existingSong = songs.find(s => s.title && s.title.toLowerCase() === searchTitle);
      
      if (existingSong) {
        finalSongIds.push(existingSong.id);
      } else {
        const newId = generateShortId();
        const newSong: Song = { 
          id: newId, 
          title: item.title.trim(), 
          artist: 'Manual', 
          key: (item.key || '').toUpperCase() 
        };
        setSongs(prev => [...prev, newSong]);
        finalSongIds.push(newId);
      }
    });

    const finalAssignments: ScheduleAssignment[] = [
      { role: 'Vocal Líder', memberId: leaderId },
      ...vocalIds.map(id => ({ role: 'Vocal', memberId: id })),
      ...Object.entries(instruments).filter(([_, id]) => id !== '').map(([role, id]) => ({ role, memberId: id }))
    ];

    const newSchedule: Schedule = {
      id: generateShortId(),
      date,
      serviceType,
      members: [leaderId, ...vocalIds, ...Object.values(instruments).filter(id => id !== '')],
      assignments: finalAssignments,
      songs: finalSongIds,
      leaderId,
      vocalIds
    };

    setSchedules(prev => [newSchedule, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setLeaderId('');
    setVocalIds([]);
    setInstruments({ 'Teclado': '', 'Violão': '', 'Baixo': '', 'Bateria': '' });
    setTempSetlist([{title: '', key: ''}]);
  };

  const removeSchedule = (id: string) => {
    if (confirm('Remover esta escala?')) setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Escalas</h2>
          <p className="text-slate-500 font-medium">Gestão de louvor da igreja.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all disabled:opacity-50"
            title="Atualizar dados da nuvem"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg"
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
            {isAdding ? 'CANCELAR' : 'NOVA ESCALA'}
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={addSchedule} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">DATA DO EVENTO</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">PERÍODO / TIPO</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold">
                <option>Domingo (Noite)</option>
                <option>Domingo (Manhã)</option>
                <option>Quarta-feira</option>
                <option>Evento Especial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase text-xs tracking-widest">
                <Mic2 size={16} className="text-emerald-600" /> Equipe Ministerial
              </h4>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-black text-emerald-700 mb-2 uppercase">🎤 VOCAL LÍDER (MINISTRAÇÃO)</label>
                  <select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold outline-none" required>
                    <option value="">Selecione o Líder...</option>
                    {(members || []).filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">🗣️ VOCALS (BACKING)</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {(members || []).filter(m => m.isActive && m.id !== leaderId).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleVocal(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${vocalIds.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(instruments).map(role => (
                    <div key={role} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">{role}</label>
                      <select 
                        value={instruments[role]} 
                        onChange={(e) => setInstruments(prev => ({...prev, [role]: e.target.value}))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                      >
                        <option value="">-</option>
                        {(members || []).filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase text-xs tracking-widest">
                <Music size={16} className="text-emerald-600" /> Repertório
              </h4>
              <div className="space-y-3">
                {tempSetlist.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nome da Música"
                      value={item.title}
                      onChange={(e) => updateSetlistItem(idx, 'title', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Tom"
                      value={item.key}
                      onChange={(e) => updateSetlistItem(idx, 'key', e.target.value)}
                      className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 font-black text-center text-xs uppercase text-emerald-600"
                    />
                    <button type="button" onClick={() => removeSetlistItem(idx)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" onClick={addSetlistItem} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-emerald-300 hover:text-emerald-500 transition-all">+ ADICIONAR MÚSICA</button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-slate-400">CANCELAR</button>
            <button type="submit" className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all">SALVAR ESCALA</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {schedules.map((sch) => {
          const d = new Date(sch.date);
          const leader = members.find(m => m.id === sch.leaderId);
          const vocalNames = (sch.vocalIds || []).map(id => members.find(m => m.id === id)?.name).filter(Boolean);
          
          return (
            <div key={sch.id} className="bg-[#0b3d2e] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden flex flex-col group border-4 border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <CalendarIcon size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight uppercase tracking-tight">Escala de Louvor 🕊️</h3>
                    <p className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest">
                      {d.toLocaleDateString('pt-BR')} - {d.toLocaleDateString('pt-BR', { weekday: 'long' })} ({sch.serviceType})
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => handleShare(sch)} className="p-2 bg-white/10 rounded-lg hover:bg-emerald-500 transition-all text-white" title="Compartilhar no WhatsApp">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => removeSchedule(sch.id)} className="p-2 bg-white/10 rounded-lg hover:bg-red-500 transition-all text-white">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-4 flex-1">
                <div className="flex items-center gap-3">
                  <Mic2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium"><strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">Líder:</strong> {leader?.name || 'A definir'}</span>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare size={18} className="text-emerald-400 shrink-0 mt-1" />
                  <span className="text-sm font-medium"><strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">Vocals:</strong> {vocalNames.join(', ') || 'A definir'}</span>
                </div>

                {(sch.assignments || []).filter(a => !['Vocal Líder', 'Vocal'].includes(a.role)).map((a, i) => {
                  const m = members.find(x => x.id === a.memberId);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      {a.role === 'Teclado' ? <Piano size={18} className="text-emerald-400 shrink-0" /> : <Guitar size={18} className="text-emerald-400 shrink-0" />}
                      <span className="text-sm font-medium"><strong className="font-black uppercase text-[10px] tracking-widest text-emerald-200/60 block">{a.role}:</strong> {m?.name || 'A definir'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3">
                  <Music size={14} /> Músicas do Dia
                </h4>
                <div className="space-y-1.5">
                  {(sch.songs || []).length > 0 ? sch.songs.map((sId, i) => {
                    const s = songs.find(x => x.id === sId);
                    return (
                      <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl text-xs">
                        <span className="font-bold opacity-90">{i+1}. {s?.title || 'Música Desconhecida'}</span>
                        {s?.key && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase">{s.key}</span>}
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-white/30 italic">A definir</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <CalendarIcon size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma escala programada</p>
          </div>
        )}
      </div>
    </div>
  );
};
