import React, { useState, useMemo } from 'react';
import { RehearsalNote, NoteItem, Song, ViewType } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Pin, 
  CheckSquare, 
  Square, 
  Music, 
  Search, 
  Calendar, 
  FileText, 
  Check, 
  X, 
  ExternalLink, 
  Tag,
  ListTodo,
  StickyNote,
  Sparkles,
  ChevronRight,
  Share2,
  Copy,
  Send,
  MessageCircle
} from 'lucide-react';

interface NotesProps {
  notes: RehearsalNote[];
  setNotes: React.Dispatch<React.SetStateAction<RehearsalNote[]>>;
  songs: Song[];
  onSync: () => void;
  onSaveToCloud?: (payload?: any) => Promise<any>;
  isSyncing: boolean;
  isAdmin: boolean;
}

export const Notes: React.FC<NotesProps> = ({
  notes = [],
  setNotes,
  songs = [],
  onSync,
  onSaveToCloud,
  isSyncing,
  isAdmin
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<RehearsalNote | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Post-save WhatsApp Share modal state
  const [savedNoteForShare, setSavedNoteForShare] = useState<RehearsalNote | null>(null);
  const [copiedShareFeedback, setCopiedShareFeedback] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'rehearsal' | 'general' | 'songs_list' | 'quick_reminder'>('rehearsal');
  const [content, setContent] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [items, setItems] = useState<NoteItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [songSearchInput, setSongSearchInput] = useState('');

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setCategory('rehearsal');
    setContent('');
    setSelectedSongIds([]);
    setItems([]);
    setNewItemText('');
    setPinned(false);
    setSongSearchInput('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (note: RehearsalNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setCategory(note.category);
    setContent(note.content || '');
    setSelectedSongIds(note.songIds || []);
    setItems(note.items || []);
    setNewItemText('');
    setPinned(!!note.pinned);
    setSongSearchInput('');
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormError(null);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem: NoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newItemText.trim(),
      done: false
    };
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleSongSelect = (songId: string) => {
    setSelectedSongIds(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Por favor, informe o título da anotação.');
      return;
    }
    setFormError(null);

    let targetNote: RehearsalNote;
    const currentNotes = notes || [];
    let updatedNotes: RehearsalNote[];

    if (editingNote) {
      targetNote = {
        ...editingNote,
        title: title.trim(),
        category,
        content: content.trim(),
        songIds: selectedSongIds,
        items,
        pinned
      };
      updatedNotes = currentNotes.map(n => n.id === editingNote.id ? targetNote : n);
    } else {
      targetNote = {
        id: `note-${Date.now()}`,
        title: title.trim(),
        category,
        content: content.trim(),
        songIds: selectedSongIds,
        items,
        pinned,
        createdAt: new Date().toISOString().split('T')[0]
      };
      updatedNotes = [targetNote, ...currentNotes];
    }

    setNotes(updatedNotes);
    try {
      localStorage.setItem('louvor_notes', JSON.stringify(updatedNotes));
    } catch (err) {
      console.error('Falha ao salvar anotação localmente:', err);
    }

    if (onSaveToCloud) {
      onSaveToCloud({ notes: updatedNotes });
    }

    closeModal();
    // Offer WhatsApp copy & share immediately!
    setSavedNoteForShare(targetNote);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta anotação?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleToggleNotePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleToggleCardItem = (noteId: string, itemId: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId || !n.items) return n;
      return {
        ...n,
        items: n.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
      };
    }));
  };

  const formatNoteForWhatsApp = (note: RehearsalNote) => {
    const linkedSongs = songs.filter(s => note.songIds?.includes(s.id));
    let text = `📌 *${note.title.toUpperCase()}*\n`;
    if (note.createdAt) {
      const formattedDate = note.createdAt.split('-').reverse().join('/');
      text += `📅 _Data: ${formattedDate}_\n`;
    }
    text += `\n`;

    if (note.content) {
      text += `📝 *Observações:*\n${note.content}\n\n`;
    }

    if (note.items && note.items.length > 0) {
      text += `📋 *Tópicos / Pauta:*\n`;
      note.items.forEach(item => {
        text += `${item.done ? '✅' : '▫️'} ${item.text}\n`;
      });
      text += `\n`;
    }

    if (linkedSongs.length > 0) {
      text += `🎵 *Músicas para o Ensaio (${linkedSongs.length}):*\n`;
      linkedSongs.forEach((song, idx) => {
        text += `${idx + 1}. *${song.title}* - ${song.artist}`;
        if (song.key) text += ` _(Tom: ${song.key})_`;
        if (song.youtubeUrl) text += `\n   ▶️ ${song.youtubeUrl}`;
        text += `\n`;
      });
      text += `\n`;
    }

    text += `_Enviado via Louvor Manager Pro_`;
    return text;
  };

  const handleCopyNoteForWhatsApp = (note: RehearsalNote) => {
    const text = formatNoteForWhatsApp(note);
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2500);
  };

  const handleShareToWhatsApp = (note: RehearsalNote) => {
    const text = formatNoteForWhatsApp(note);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtering & Sorting
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesCategory = 
        filterCategory === 'all' ? true :
        filterCategory === 'pinned' ? n.pinned :
        n.category === filterCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = n.content?.toLowerCase().includes(q);
      const itemsMatch = n.items?.some(i => i.text.toLowerCase().includes(q));
      
      // Check linked songs matching
      const linkedSongs = songs.filter(s => n.songIds?.includes(s.id));
      const songMatch = linkedSongs.some(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));

      return matchesCategory && (titleMatch || contentMatch || itemsMatch || songMatch);
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [notes, filterCategory, searchQuery, songs]);

  const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
    rehearsal: { label: 'Lista de Ensaio', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    songs_list: { label: 'Seleção de Músicas', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    general: { label: 'Anotação Geral', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    quick_reminder: { label: 'Lembrete Rápido', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' }
  };

  const filteredSongsForModal = useMemo(() => {
    if (!songSearchInput.trim()) return songs.slice(0, 8);
    const q = songSearchInput.toLowerCase();
    return songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [songs, songSearchInput]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter flex items-center gap-2">
            <StickyNote className="text-emerald-600 dark:text-emerald-400" size={28} /> Anotações & Listas de Ensaio
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Crie lembretes, pautas de reuniões e selecione músicas para os ensaios
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/10 flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> Nova Anotação / Lista
        </button>
      </header>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'rehearsal', label: '🎵 Listas de Ensaio' },
              { id: 'songs_list', label: '🎼 Seleção de Músicas' },
              { id: 'general', label: '📝 Anotações Gerais' },
              { id: 'quick_reminder', label: '📌 Lembretes' },
              { id: 'pinned', label: '⭐ Fixados' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar pautas, músicas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-xs placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const catInfo = categoryLabels[note.category] || categoryLabels['general'];
            const linkedSongs = songs.filter(s => note.songIds?.includes(s.id));
            const completedItemsCount = note.items?.filter(i => i.done).length || 0;
            const totalItemsCount = note.items?.length || 0;

            return (
              <div 
                key={note.id}
                className={`bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between p-6 relative group ${
                  note.pinned ? 'border-amber-300 dark:border-amber-500/50 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700/50'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${catInfo.bg} ${catInfo.color}`}>
                      {catInfo.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleNotePin(note.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          note.pinned 
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={note.pinned ? "Desafixar" : "Fixar no topo"}
                      >
                        <Pin size={15} className={note.pinned ? 'fill-amber-500' : ''} />
                      </button>

                      <button
                        onClick={() => openEditModal(note)}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Date */}
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug mb-1">
                    {note.title}
                  </h3>
                  {note.createdAt && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1">
                      <Calendar size={11} /> {note.createdAt.split('-').reverse().join('/')}
                    </p>
                  )}

                  {/* Note Content Text */}
                  {note.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {note.content}
                    </p>
                  )}

                  {/* Checklist Items */}
                  {note.items && note.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                        <span className="flex items-center gap-1"><ListTodo size={12} /> Itens / Tarefas</span>
                        <span>{completedItemsCount}/{totalItemsCount}</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                        {note.items.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleCardItem(note.id, item.id)}
                            className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                              item.done 
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-900/40 text-slate-400 dark:text-slate-500 line-through' 
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-200 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {item.done ? (
                                <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square size={14} className="text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                            <span className="text-xs font-semibold leading-tight">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Songs */}
                  {linkedSongs.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                        <Music size={12} /> Músicas Selecionadas ({linkedSongs.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedSongs.map(song => (
                          <div 
                            key={song.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs"
                          >
                            <span className="truncate max-w-[150px]">{song.title}</span>
                            {song.key && (
                              <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                                {song.key}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800 mt-2">
                  <button
                    onClick={() => handleCopyNoteForWhatsApp(note)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar texto completo para área de transferência"
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check size={14} className="text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleShareToWhatsApp(note)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
                    title="Enviar diretamente pelo WhatsApp Web / App"
                  >
                    <Send size={14} /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 p-12 text-center space-y-3">
          <StickyNote size={40} className="text-slate-200 dark:text-slate-700 mx-auto" />
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhuma anotação encontrada</p>
          <p className="text-xs text-slate-300 dark:text-slate-600">Clique no botão "Nova Anotação / Lista" para registrar pautas de ensaio ou recados.</p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <StickyNote className="text-emerald-600 dark:text-emerald-400" size={22} />
                {editingNote ? 'Editar Anotação / Lista' : 'Nova Anotação / Lista'}
              </h3>
              <button 
                type="button" 
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <X size={16} /> {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-1">Título</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Ensaio para o Culto de Domingo, Ajustes de Tom..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-sm"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-1">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-xs"
                  >
                    <option value="rehearsal" className="dark:bg-slate-900">🎵 Lista de Ensaio</option>
                    <option value="songs_list" className="dark:bg-slate-900">🎼 Seleção de Músicas</option>
                    <option value="general" className="dark:bg-slate-900">📝 Anotação Geral</option>
                    <option value="quick_reminder" className="dark:bg-slate-900">📌 Lembrete Rápido</option>
                  </select>
                </div>
              </div>

              {/* Pin Checkbox */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Pin size={14} className="text-amber-500" /> Fixar esta anotação no topo
              </label>

              {/* Content / Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 ml-1">Observações / Pauta</label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escreva detalhes do ensaio, recados para a equipe, etc..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-semibold text-xs leading-relaxed"
                />
              </div>

              {/* Checklist Builder */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ListTodo size={14} className="text-emerald-600 dark:text-emerald-400" /> Tópicos / Checklist
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="Adicionar item (ex: Testar caixa de som, Passar solo)..."
                    className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {items.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar pt-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 px-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>• {item.text}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Song Selector */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Music size={14} className="text-emerald-600 dark:text-emerald-400" /> Vincular Músicas do Repertório ({selectedSongIds.length})
                  </label>
                </div>

                <input
                  type="text"
                  value={songSearchInput}
                  onChange={e => setSongSearchInput(e.target.value)}
                  placeholder="Pesquisar música por nome ou artista..."
                  className="w-full px-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold placeholder-slate-400"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar pt-1">
                  {filteredSongsForModal.map(s => {
                    const isSelected = selectedSongIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleSongSelect(s.id)}
                        className={`p-2.5 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="text-xs font-extrabold truncate">{s.title}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>{s.artist}</p>
                        </div>
                        {isSelected && <Check size={14} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/10 cursor-pointer"
                >
                  Salvar Anotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE / COPY MODAL AFTER SAVING NOTE */}
      {savedNoteForShare && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setSavedNoteForShare(null); setCopiedShareFeedback(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-200 dark:border-emerald-800">
                  Anotação Salva com Sucesso!
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Copiar para o WhatsApp</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Envie a pauta ou lista de ensaio diretamente para a equipe</p>
              </div>
            </div>

            {/* Formatted Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed select-all">
              {formatNoteForWhatsApp(savedNoteForShare)}
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const text = formatNoteForWhatsApp(savedNoteForShare);
                  navigator.clipboard.writeText(text);
                  setCopiedShareFeedback(true);
                  setTimeout(() => setCopiedShareFeedback(false), 3000);
                }}
                className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  copiedShareFeedback 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copiedShareFeedback ? (
                  <>
                    <Check size={18} /> Copiado! Pronto para Colar no WhatsApp
                  </>
                ) : (
                  <>
                    <Copy size={18} /> Copiar Texto para WhatsApp
                  </>
                )}
              </button>

              <button 
                onClick={() => {
                  handleShareToWhatsApp(savedNoteForShare);
                }}
                className="w-full py-3.5 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Send size={18} /> Abrir Diretamente no WhatsApp
              </button>

              <button 
                onClick={() => { setSavedNoteForShare(null); setCopiedShareFeedback(false); }}
                className="w-full py-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors text-center cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
