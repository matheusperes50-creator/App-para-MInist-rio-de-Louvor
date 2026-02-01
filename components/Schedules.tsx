import React, { useState } from 'react';
import { Schedule, Member, Song } from '../types';
import { CalendarDays, Plus, Calendar as CalendarIcon, Users, Music, Trash2, X, Check, ExternalLink } from 'lucide-react';

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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
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

  const getGoogleCalendarUrl = (sch: Schedule) => {
    const d = new Date(sch.date);
    const dateStr = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`LouvorPIBJE: ${sch.serviceType}`);
    const memberNames = sch.members.map(mId => members.find(m => m.id === mId)?.name).filter(Boolean).join(', ');
    const songNames = sch.songs.map(sId => songs.find(s => s.id === sId)?.title).filter(Boolean).join(', ');
    const details = encodeURIComponent(`Equipe: ${memberNames}\n\nSetlist:\n${songNames}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
  };

  const addSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || selectedMembers.length === 0) {
      alert("Selecione a data e pelo menos um membro.");
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

    const newSchedule: Schedule = {
      id: generateShortId(),
      date,
      serviceType,
      members: selectedMembers,
      songs: finalSongIds,
    };

    setSchedules(prev => [newSchedule, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setIsAdding(false);
    setDate('');
    setServiceType('Culto de Celebração');
    setSelectedMembers([]);
    setTempSetlist([{title: '', key: ''}]);
  };

  const removeSchedule = (id: string) => {
    if (confirm('Remover esta escala?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Escalas</h2>
          <p className="text-slate-500">Organize a equipe e o setlist do dia.</p>
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
        <form onSubmit={addSchedule} className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 max-w-5xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section>
              <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 border-b pb-3 border-slate-100 uppercase text-xs tracking-widest">
                <Users size={18} className="text-emerald-600" /> Equipe
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                {members.filter(m => m.isActive).map(m => (
                  <label key={m.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2
                    ${selectedMembers.includes(m.id) 
                      ? 'bg-emerald-50 border-emerald-500' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedMembers.includes(m.id)} 
                      onChange={() => toggleMember(m.id)}
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedMembers.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {selectedMembers.includes(m.id) && <Check size={14} />}
                    </div>
                    <span className="font-bold text-slate-800">{m.name}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 border-b pb-3 border-slate-100 uppercase text-xs tracking-widest">
                <Music size={18} className="text-emerald-600" /> Setlist (Preencha as Músicas)
              </h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
                    <button 
                      type="button" 
                      onClick={() => removeSetlistItem(index)}
                      className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
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
              <h3 className="text-2xl font-black text-slate-800 mb-4">{sch.serviceType}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Membros na Escala</p>
                  <div className="flex flex-wrap gap-2">
                    {sch.members.map(mId => {
                      const member = members.find(m => m.id === mId);
                      return member ? (
                        <span key={mId} className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold">
                          {member.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Setlist</p>
                  <div className="space-y-2">
                    {sch.songs.map((sId, idx) => {
                      const song = songs.find(s => s.id === sId);
                      return song ? (
                        <div key={sId} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                          <span className="font-bold text-slate-700">{song.title}</span>
                          {song.key && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-400">{song.key}</span>}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};