import React, { useState } from 'react';
import { ExternalEvent, Member, Song } from '../types';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Trash2, 
  X, 
  Check, 
  Clock, 
  Info, 
  Send,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
  Music,
  MessageCircle,
  Copy,
  Edit
} from 'lucide-react';

interface EventsProps {
  events: ExternalEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ExternalEvent[]>>;
  members: Member[];
  songs: Song[];
  isAdmin: boolean;
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Events: React.FC<EventsProps> = ({ events = [], setEvents, members = [], songs = [], isAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const getEventText = (event: ExternalEvent) => {
    const dateFormatted = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    let text = `📅 *CONVITE / EVENTO: ${event.title.toUpperCase()}* ⛪\n\n`;
    text += `🗓️ Data: ${dateFormatted}\n`;
    if (event.time) {
      text += `⏰ Horário: ${event.time}\n`;
    }
    text += `📍 Local: ${event.location}\n`;
    if (event.description) {
      text += `📝 Descrição: ${event.description}\n`;
    }
    
    if (event.repertoire && event.repertoire.length > 0) {
      text += `\n🎶 *REPERTÓRIO:*\n`;
      event.repertoire.forEach((sId, i) => {
        const song = songs.find(s => s.id === sId || (s.title && s.title.toLowerCase() === sId?.toLowerCase()));
        if (song) {
          const rawLink = song.youtubeUrl || (song as any).link || (song as any).url;
          const trimmedLink = rawLink && typeof rawLink === 'string' ? rawLink.trim() : '';
          const validLink = trimmedLink ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`) : null;

          text += `${i + 1}. ${song.title}${song.key ? ` (${song.key})` : ''}\n`;
          if (validLink) {
            const icon = validLink.includes('youtu') ? '▶️' : '🔗';
            text += `   ${icon} ${validLink}\n`;
          }
        }
      });
    }
    
    text += `\n_Gerado pelo App Minist. Louvor Pibje_`;
    return text;
  };

  const handleCopyEventText = async (event: ExternalEvent) => {
    const text = getEventText(event);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(event.id);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newLocation) {
      alert("Preencha o título, data e local.");
      return;
    }

    if (editingEventId) {
      setEvents(prev => prev.map(e => e.id === editingEventId ? {
        ...e,
        title: newTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        description: newDescription,
        repertoire: selectedSongs,
        memberIds: selectedMembers
      } : e).sort((a, b) => b.date.localeCompare(a.date)));
    } else {
      const newEvent: ExternalEvent = {
        id: generateShortId(),
        title: newTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        description: newDescription,
        status: 'pending',
        repertoire: selectedSongs,
        memberIds: selectedMembers
      };
      setEvents(prev => [newEvent, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    }
    
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setNewLocation('');
    setNewDescription('');
    setSelectedSongs([]);
    setSelectedMembers([]);
    setEditingEventId(null);
  };

  const handleEditEvent = (event: ExternalEvent) => {
    setNewTitle(event.title);
    setNewDate(event.date);
    setNewTime(event.time || '');
    setNewLocation(event.location);
    setNewDescription(event.description || '');
    setSelectedSongs(event.repertoire || []);
    setSelectedMembers(event.memberIds || []);
    setEditingEventId(event.id);
    setIsAdding(true);
  };

  const removeEvent = (id: string) => {
    if (confirm('Remover este evento?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const updateStatus = (id: string, status: ExternalEvent['status']) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const toggleSong = (id: string) => {
    setSelectedSongs(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const getStatusStyle = (status: ExternalEvent['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Eventos & Convites</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão de agendas externas e convites.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg text-xs uppercase tracking-widest cursor-pointer"
            >
              {isAdding ? <X size={18} /> : <Plus size={18} />}
              {isAdding ? 'CANCELAR' : 'NOVO CONVITE'}
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'upcoming' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Próximos
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          Histórico
        </button>
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleSaveEvent} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-emerald-100 dark:border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter">
            {editingEventId ? 'Editar Convite/Evento' : 'Cadastrar Novo Convite/Evento'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Título do Evento</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Congresso de Jovens - PIB" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Data</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-sm" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Horário</label>
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Local / Endereço</label>
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Rua das Flores, 123" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Descrição / Observações</label>
              <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Tema: Santidade" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Integrantes Convocados</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {members.filter(m => m.isActive).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 cursor-pointer ${selectedMembers.includes(m.id) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-emerald-200 dark:hover:border-slate-600'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-2">Repertório do Evento</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {songs.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSong(s.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 cursor-pointer ${selectedSongs.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200 dark:hover:border-slate-600'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button type="button" onClick={() => { setIsAdding(false); resetForm(); }} className="px-6 py-3 font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">CANCELAR</button>
            <button type="submit" className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs cursor-pointer">
              {editingEventId ? 'SALVAR ALTERAÇÕES' : 'CRIAR EVENTO'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.filter(e => {
          const isPassed = new Date(e.date + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0));
          return activeTab === 'history' ? isPassed : !isPassed;
        }).length > 0 ? (
          events.filter(e => {
            const isPassed = new Date(e.date + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0));
            return activeTab === 'history' ? isPassed : !isPassed;
          }).map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(event.status)}`}>
                  {event.status === 'pending' ? <Clock size={12} /> : event.status === 'confirmed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {event.status === 'pending' ? 'Aguardando confirmação' : event.status === 'confirmed' ? 'Confirmado' : 'Recusado'}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopyEventText(event)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${copyFeedback === event.id ? 'bg-emerald-500 text-white' : 'text-slate-300 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'}`}
                    title="Copiar para WhatsApp"
                  >
                    {copyFeedback === event.id ? <Check size={18} /> : <MessageCircle size={18} />}
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEditEvent(event)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer" title="Editar Evento">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => removeEvent(event.id)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 transition-colors cursor-pointer" title="Remover Evento">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-2">{event.title}</h4>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Calendar size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold">{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Clock size={16} className="text-emerald-500" />
                        <span className="text-sm font-bold">{event.time}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold">{event.location}</span>
                  </div>
                  {event.description && (
                    <div className="flex items-start gap-3 text-slate-400 dark:text-slate-400">
                      <Info size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium leading-relaxed">{event.description}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Users size={12} /> Integrantes ({(event.memberIds || []).length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(event.memberIds || []).map(mId => {
                        const member = members.find(m => m.id === mId);
                        return (
                          <span key={mId} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 rounded-lg">
                            {member?.name || 'Integrante'}
                          </span>
                        );
                      })}
                      {(!event.memberIds || event.memberIds.length === 0) && <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">Nenhum integrante selecionado</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Music size={12} /> Repertório ({(event.repertoire || []).length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(event.repertoire || []).map(sId => {
                        const song = songs.find(s => s.id === sId);
                        return (
                          <span key={sId} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-[9px] font-black uppercase text-indigo-500 dark:text-indigo-400 rounded-lg">
                            {song?.title || 'Música'}
                          </span>
                        );
                      })}
                      {(!event.repertoire || event.repertoire.length === 0) && <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">Nenhuma música selecionada</span>}
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-8 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => updateStatus(event.id, 'pending')}
                    className={`py-3 rounded-2xl font-black text-[8px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${event.status === 'pending' ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
                  >
                    <Clock size={14} /> Aguardar
                  </button>
                  <button 
                    onClick={() => updateStatus(event.id, 'confirmed')}
                    className={`py-3 rounded-2xl font-black text-[8px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${event.status === 'confirmed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'}`}
                  >
                    <Check size={14} /> Confirmar
                  </button>
                  <button 
                    onClick={() => updateStatus(event.id, 'declined')}
                    className={`py-3 rounded-2xl font-black text-[8px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${event.status === 'declined' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                  >
                    <X size={14} /> Recusar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-inner">
            <Calendar size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Nenhum evento externo</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 font-medium">Cadastre convites para tocar fora ou eventos especiais aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};
