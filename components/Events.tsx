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
  Copy
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
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const getEventText = (event: ExternalEvent) => {
    const dateFormatted = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    let text = `📅 *CONVITE / EVENTO: ${event.title.toUpperCase()}* ⛪\n\n`;
    text += `🗓️ Data: ${dateFormatted}\n`;
    text += `📍 Local: ${event.location}\n`;
    if (event.description) {
      text += `📝 Descrição: ${event.description}\n`;
    }
    
    if (event.repertoire && event.repertoire.length > 0) {
      text += `\n🎶 *REPERTÓRIO:*\n`;
      event.repertoire.forEach((sId, i) => {
        const song = songs.find(s => s.id === sId);
        if (song) {
          text += `${i + 1}. ${song.title}\n`;
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

    const newEvent: ExternalEvent = {
      id: generateShortId(),
      title: newTitle,
      date: newDate,
      location: newLocation,
      description: newDescription,
      status: 'pending',
      repertoire: selectedSongs
    };

    setEvents(prev => [newEvent, ...prev].sort((a, b) => a.date.localeCompare(b.date)));
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDate('');
    setNewLocation('');
    setNewDescription('');
    setSelectedSongs([]);
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
          <h2 className="text-3xl font-black text-slate-900">Eventos & Convites</h2>
          <p className="text-slate-500 font-medium">Gestão de agendas externas e convites.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg text-xs uppercase tracking-widest"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'CANCELAR' : 'NOVO CONVITE'}
          </button>
        )}
      </header>

      {isAdding && isAdmin && (
        <form onSubmit={handleSaveEvent} className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tighter">Cadastrar Novo Convite/Evento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Título do Evento</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Congresso de Jovens - PIB" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Data</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Local / Endereço</label>
              <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Rua das Flores, 123" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descrição / Observações</label>
              <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold" placeholder="Ex: Tema: Santidade" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Repertório do Evento</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {songs.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSong(s.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${selectedSongs.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-4">
            <button type="button" onClick={() => { setIsAdding(false); resetForm(); }} className="px-6 py-3 font-bold text-slate-400">CANCELAR</button>
            <button type="submit" className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">CRIAR EVENTO</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(event.status)}`}>
                  {event.status === 'pending' ? <Clock size={12} /> : event.status === 'confirmed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {event.status === 'pending' ? 'Pendente' : event.status === 'confirmed' ? 'Confirmado' : 'Recusado'}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopyEventText(event)}
                    className={`p-2 rounded-xl transition-all ${copyFeedback === event.id ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                    title="Copiar para WhatsApp"
                  >
                    {copyFeedback === event.id ? <Check size={18} /> : <MessageCircle size={18} />}
                  </button>
                  {isAdmin && (
                    <button onClick={() => removeEvent(event.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-2xl font-black text-slate-800 leading-tight mb-2">{event.title}</h4>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Calendar size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold">{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold">{event.location}</span>
                  </div>
                  {event.description && (
                    <div className="flex items-start gap-3 text-slate-400">
                      <Info size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium leading-relaxed">{event.description}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Music size={12} /> Repertório ({(event.repertoire || []).length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(event.repertoire || []).map(sId => {
                      const song = songs.find(s => s.id === sId);
                      return (
                        <span key={sId} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-[9px] font-black uppercase text-indigo-500 rounded-lg">
                          {song?.title || 'Música'}
                        </span>
                      );
                    })}
                    {(!event.repertoire || event.repertoire.length === 0) && <span className="text-[10px] text-slate-300 font-bold italic">Nenhuma música selecionada</span>}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateStatus(event.id, 'confirmed')}
                    className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${event.status === 'confirmed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <Check size={14} /> Confirmar
                  </button>
                  <button 
                    onClick={() => updateStatus(event.id, 'declined')}
                    className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${event.status === 'declined' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    <X size={14} /> Recusar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Nenhum evento externo</p>
            <p className="text-[10px] text-slate-300 mt-2 font-medium">Cadastre convites para tocar fora ou eventos especiais aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};
