import React, { useState } from 'react';
import { Schedule, Member, Song } from '../types';
import { CalendarDays, Plus, Calendar as CalendarIcon, Users, Music, Trash2 } from 'lucide-react';

interface SchedulesProps {
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  members: Member[];
  songs: Song[];
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Schedules: React.FC<SchedulesProps> = ({ schedules, setSchedules, members, songs }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState('Culto de Celebração');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  const addSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || selectedMembers.length === 0) return;

    const newSchedule: Schedule = {
      id: generateShortId(),
      date,
      serviceType,
      members: selectedMembers,
      songs: selectedSongs,
    };

    setSchedules(prev => [newSchedule, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsAdding(false);
    setDate('');
    setServiceType('Culto de Celebração');
    setSelectedMembers([]);
    setSelectedSongs([]);
  };

  const removeSchedule = (id: string) => {
    if (confirm('Remover esta escala?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleSelection = (id: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Escalas</h2>
          <p className="text-slate-500">Organize quem toca e o que será tocado.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          <Plus size={18} />
          {isAdding ? 'Fechar' : 'Nova Escala'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={addSchedule} className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 max-w-5xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Data do Culto</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all text-lg font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Tipo de Serviço</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all text-lg font-medium"
              >
                <option>Culto de Celebração</option>
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
                <Users size={18} className="text-emerald-600" /> Seleção de Equipe
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-3">
                {members.filter(m => m.isActive).map(m => (
                  <label key={m.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2
                    ${selectedMembers.includes(m.id) 
                      ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
                      checked={selectedMembers.includes(m.id)} 
                      onChange={() => toggleSelection(m.id, selectedMembers, setSelectedMembers)}
                    />
                    <div className="flex-1">
                      <p className="font-black text-slate-800 leading-none mb-1.5">{m.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="font-black text-slate-800 mb-5 flex items-center gap-3 border-b pb-3 border-slate-100 uppercase text-xs tracking-widest">
                <Music size={18} className="text-emerald-600" /> Seleção do Setlist
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-3">
                {songs.map(s => (
                  <label key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2
                    ${selectedSongs.includes(s.id) 
                      ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
                      checked={selectedSongs.includes(s.id)} 
                      onChange={() => toggleSelection(s.id, selectedSongs, setSelectedSongs)}
                    />
                    <div className="flex-1">
                      <p className="font-black text-slate-800 leading-none mb-1">{s.title}</p>
                      <p className="text-[10px] uppercase font-black text-emerald-600">{s.artist}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
            <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3.5 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
            <button type="submit" className="px-12 py-3.5 bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all">Publicar Escala</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {schedules.map((sch) => (
          <div key={sch.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
               <span className="font-mono text-[10px] text-slate-300 font-bold">ID: {sch.id}</span>
               <button 
                onClick={() => removeSchedule(sch.id)}
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <Trash2 size={22} />
              </button>
            </div>
            
            <div className="md:w-52 flex-shrink-0 flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-700">
              <CalendarIcon size={36} className="mb-3 opacity-50" />
              <p className="text-3xl font-black tracking-tighter leading-none mb-1">
                {new Date(sch.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">
                {new Date(sch.date).toLocaleDateString('pt-BR', { year: 'numeric' })}
              </p>
            </div>

            <div className="flex-1 py-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4">{sch.serviceType}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Equipe Confirmada</p>
                  <div className="flex flex-wrap gap-2">
                    {sch.members.map(mId => {
                      const member = members.find(m => m.id === mId);
                      return member ? (
                        <div key={mId} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                          {member.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Setlist Selecionada</p>
                  <div className="space-y-2">
                    {sch.songs.map((sId, idx) => {
                      const song = songs.find(s => s.id === sId);
                      return song ? (
                        <div key={sId} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <span className="font-bold text-slate-700">{song.title}</span>
                          <span className="text-[10px] text-emerald-500 uppercase font-medium">{song.artist}</span>
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