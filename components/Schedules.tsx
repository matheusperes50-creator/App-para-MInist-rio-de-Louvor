import React, { useState } from 'react';
import { Schedule, Member, Song, ScheduleAssignment, Role } from '../types';
import { CalendarDays, Plus, Calendar as CalendarIcon, Users, Music, Trash2, X, Check, Mic2, Star, Guitar, Drum, Piano } from 'lucide-react';

interface SchedulesProps {
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  members: Member[];
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Schedules: React.FC<SchedulesProps> = ({ 
  schedules, 
  setSchedules, 
  members, 
  songs, 
  setSongs 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('Culto de Celebração');
  
  // Estado para gerenciar as atribuições por função
  const [assignments, setAssignments] = useState<Record<string, string>>({
    'Vocal Líder': '',
    'Backing Vocal 1': '',
    'Backing Vocal 2': '',
    'Violão/Guitarra': '',
    'Baixo': '',
    'Bateria': '',
    'Teclado': ''
  });

  const [tempSetlist, setTempSetlist] = useState<{title: string, key: string}[]>([{title: '', key: ''}]);

  const addSetlistItem = () => {
    setTempSetlist([...tempSetlist, { title: '', key: '' }]);
  };

  const removeSetlistItem = (index: number) => {
    setTempSetlist(tempSetlist.filter((_, i) => i !== index));
  };

  const updateSetlistItem = (index: number, field: 'title' | 'key', value: string) => {
    const newList = [...tempSetlist];
    newList[index][field] = value;
    setTempSetlist(newList);
  };

  const updateAssignment = (role: string, memberId: string) => {
    setAssignments(prev => ({ ...prev, [role]: memberId }));
  };

  const getGoogleCalendarUrl = (sch: Schedule) => {
    const d = new Date(sch.date);
    const dateStr = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`LouvorPIBJE: ${sch.serviceType}`);
    const leaderName = members.find(m => m.id === sch.leaderId)?.name || 'N/A';
    const assignmentsText = sch.assignments
      .map(a => `${a.role}: ${members.find(m => m.id === a.memberId)?.name}`)
      .join('\n');
    const songNames = sch.songs.map(sId => songs.find(s => s.id === sId)?.title).filter(Boolean).join(', ');
    const details = encodeURIComponent(`Líder: ${leaderName}\n\nEscala:\n${assignmentsText}\n\nSetlist:\n${songNames}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
  };

  const addSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert("Selecione a data.");
      return;
    }

    if (!assignments['Vocal Líder']) {
      alert("Por favor, defina quem será o Vocal Líder desta escala.");
      return;
    }

    const finalSongIds: string[] = [];
    const newSongsToRepertoire: Song[] = [];

    tempSetlist.forEach(item => {
      if (!item.title.trim()) return;
      const existingSong = songs.find(s => s.title.toLowerCase() === item.title.toLowerCase().trim());
      if (existingSong) {
        finalSongIds.push(existingSong.id);
      } else {
        const newSong: Song = {
          id: generateShortId(),
          title: item.title.trim(),
          artist: 'Cadastrada via Escala',
          key: item.key.toUpperCase().trim() || undefined
        };
        newSongsToRepertoire.push(newSong);
        finalSongIds.push(newSong.id);
      }
    });

    if (newSongsToRepertoire.length > 0) {
      setSongs(prev => [...prev, ...newSongsToRepertoire]);
    }

    const finalAssignments: ScheduleAssignment[] = Object.entries(assignments)
      .filter(([_, memberId]) => memberId !== '')
      .map(([role, memberId]) => ({ role, memberId }));

    const newSchedule: Schedule = {
      id: generateShortId(),
      date,
      serviceType,
      members: finalAssignments.map(a => a.memberId),
      assignments: finalAssignments,
      songs: finalSongIds,
      leaderId: assignments['Vocal Líder']
    };

    setSchedules(prev => [newSchedule, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setIsAdding(false);
    setDate('');
    setServiceType('Culto de Celebração');
    setAssignments({
      'Vocal Líder': '',
      'Backing Vocal 1': '',
      'Backing Vocal 2': '',
      'Violão/Guitarra': '',
      'Baixo': '',
      'Bateria': '',
      'Teclado': ''
    });
    setTempSetlist([{title: '', key: ''}]);
  };

  const removeSchedule = (id: string) => {
    if (confirm('Remover esta escala?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  const roleIcons: Record<string, any> = {
    'Vocal Líder': Mic2,
    'Backing Vocal 1': Users,
    'Backing Vocal 2': Users,
    'Violão/Guitarra': Guitar,
    'Baixo': Music,
    'Bateria': Drum,
    'Teclado': Piano
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Escalas</h2>
          <p className="text-slate-500">Defina os responsáveis por cada função e o setlist.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Fechar' : 'Nova Escala'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={addSchedule} className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Data do Culto</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all text-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Tipo de Serviço</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all text-lg"
              >
                <option>Culto de Celebração</option>
                <option>Culto Manhã</option>
                <option>Culto Noite</option>
                <option>Culto de Oração</option>
                <option>Encontro de Jovens</option>
                <option>Santa Ceia</option>
                <option>Especial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Seção de Funções/Escalação */}
            <section className="space-y-6">
              <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 border-b pb-3 border-slate-100 uppercase text-xs tracking-widest">
                <Users size={18} className="text-emerald-600" /> Escalação por Função
              </h4>
              
              <div className="space-y-4">
                {Object.keys(assignments).map((roleName) => {
                  const Icon = roleIcons[roleName] || Users;
                  const isLeader = roleName === 'Vocal Líder';
                  
                  return (
                    <div key={roleName} className={`p-4 rounded-2xl border transition-all ${assignments[roleName] ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className={`flex items-center gap-2 min-w-[140px] ${isLeader ? 'text-emerald-700 font-black' : 'text-slate-500 font-bold'}`}>
                          <Icon size={16} />
                          <span className="text-xs uppercase tracking-tight">{roleName}</span>
                          {isLeader && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1">OBRIGATÓRIO</span>}
                        </div>
                        
                        <select
                          value={assignments[roleName]}
                          onChange={(e) => updateAssignment(roleName, e.target.value)}
                          className={`flex-1 px-4 py-2.5 rounded-xl border outline-none transition-all font-bold ${assignments[roleName] ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-white/50 border-slate-200 text-slate-400'}`}
                        >
                          <option value="">Selecione um membro...</option>
                          {members.filter(m => m.isActive).map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Seção de Músicas */}
            <section>
              <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 border-b pb-3 border-slate-100 uppercase text-xs tracking-widest">
                <Music size={18} className="text-emerald-600" /> Setlist do Dia
              </h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {tempSetlist.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start group">
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all flex gap-3">
                       <input
                        type="text"
                        placeholder="Nome da Música"
                        value={item.title}
                        onChange={(e) => updateSetlistItem(index, 'title', e.target.value)}
                        className="bg-transparent outline-none font-bold text-slate-800 w-full placeholder:text-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Tom"
                        value={item.key}
                        onChange={(e) => updateSetlistItem(index, 'key', e.target.value)}
                        className="bg-white border border-slate-200 px-3 py-1 rounded-lg outline-none font-black text-emerald-600 text-xs w-16 uppercase text-center"
                      />
                    </div>
                    {tempSetlist.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSetlistItem(index)}
                        className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addSetlistItem}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-300 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Adicionar Música
                </button>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
            <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3.5 text-slate-500 font-bold">Cancelar</button>
            <button type="submit" className="px-12 py-3.5 bg-emerald-600 text-white font-black uppercase tracking-[0.1em] rounded-2xl hover:bg-emerald-700 shadow-xl transition-all">Salvar Escala</button>
          </div>
        </form>
      )}

      {/* Listagem de Escalas */}
      <div className="space-y-6">
        {schedules.map((sch) => (
          <div key={sch.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all group relative">
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => removeSchedule(sch.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Remover Escala">
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="md:w-40 flex-shrink-0 flex flex-col items-center gap-3">
              <div className="w-full flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-700">
                <CalendarIcon size={24} className="mb-2 opacity-40" />
                <p className="text-2xl font-black leading-none">{new Date(sch.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1">{new Date(sch.date).toLocaleDateString('pt-BR', { year: 'numeric' })}</p>
              </div>
              
              <a 
                href={getGoogleCalendarUrl(sch)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 transition-all group/btn"
              >
                <CalendarDays size={14} className="group-hover/btn:scale-110 transition-transform" />
                Calendário
              </a>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-black text-slate-800">{sch.serviceType}</h3>
                <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full shadow-md shadow-emerald-100">
                  <Mic2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Líder: {members.find(m => m.id === sch.leaderId)?.name || 'Não definido'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Escalação Completa</p>
                  <div className="grid grid-cols-1 gap-2">
                    {sch.assignments?.map((assignment, idx) => {
                      const member = members.find(m => m.id === assignment.memberId);
                      const isLeader = assignment.role === 'Vocal Líder';
                      const Icon = roleIcons[assignment.role] || Users;
                      
                      return member ? (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isLeader ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} className={isLeader ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className={`text-[11px] font-black uppercase tracking-tighter ${isLeader ? 'text-emerald-800' : 'text-slate-500'}`}>{assignment.role}</span>
                          </div>
                          <span className={`text-sm font-bold ${isLeader ? 'text-emerald-900' : 'text-slate-700'}`}>{member.name}</span>
                        </div>
                      ) : null;
                    }) || (
                      <div className="flex flex-wrap gap-2">
                         {sch.members.map(mId => {
                            const member = members.find(m => m.id === mId);
                            return member ? (
                              <span key={mId} className="px-3 py-1 rounded-xl text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                {member.name}
                              </span>
                            ) : null;
                          })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Setlist do Louvor</p>
                  <div className="space-y-3">
                    {sch.songs.map((sId, idx) => {
                      const song = songs.find(s => s.id === sId);
                      return song ? (
                        <div key={sId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <div className="flex-1">
                            <span className="font-bold text-slate-700 text-sm block leading-none">{song.title}</span>
                          </div>
                          {song.key && <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg font-black text-emerald-600">{song.key}</span>}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">Nenhuma escala programada.</p>
            <button onClick={() => setIsAdding(true)} className="mt-4 text-emerald-600 font-black uppercase text-xs tracking-widest hover:underline">Clique para criar a primeira</button>
          </div>
        )}
      </div>
    </div>
  );
};