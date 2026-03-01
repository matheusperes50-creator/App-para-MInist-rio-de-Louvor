import React, { useState, useMemo } from 'react';
import { Song, Schedule, SongStatus } from '../types';
import { Music, Search, Trash2, Library, RefreshCw, Calendar, Plus, X, Edit3, CheckCircle2, Clock, PlayCircle, Youtube, ExternalLink, Sparkles, LayoutGrid, List } from 'lucide-react';

interface SongsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  schedules: Schedule[];
  onSync: () => void;
  isSyncing: boolean;
  isAdmin: boolean;
  filterMode?: 'repertoire' | 'new';
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const Songs: React.FC<SongsProps> = ({ 
  songs = [], 
  setSongs, 
  schedules = [], 
  onSync, 
  isSyncing, 
  isAdmin,
  filterMode = 'repertoire'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Status manual override removed since tabs now control high-level status
  // But we still allow filtering within the tab if desired (e.g. READY vs REHEARSING in repertoire)
  const [internalFilter, setInternalFilter] = useState<string>('ALL');
  
  // States for song form
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newBpm, setNewBpm] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newStatus, setNewStatus] = useState<SongStatus>(filterMode === 'new' ? SongStatus.PENDING : SongStatus.READY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNewTitle('');
    setNewArtist('');
    setNewKey('');
    setNewBpm('');
    setNewYoutubeUrl('');
    setNewStatus(filterMode === 'new' ? SongStatus.PENDING : SongStatus.READY);
    setEditingId(null);
  };

  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingId) {
      setSongs(prev => prev.map(s => s.id === editingId ? {
        ...s,
        title: newTitle.trim(),
        artist: newArtist.trim() || 'Manual',
        key: newKey.toUpperCase().trim(),
        bpm: newBpm ? parseInt(newBpm) : undefined,
        youtubeUrl: newYoutubeUrl.trim(),
        status: newStatus
      } : s));
    } else {
      const newSong: Song = {
        id: generateShortId(),
        title: newTitle.trim(),
        artist: newArtist.trim() || 'Manual',
        key: newKey.toUpperCase().trim(),
        bpm: newBpm ? parseInt(newBpm) : undefined,
        youtubeUrl: newYoutubeUrl.trim(),
        status: newStatus
      };
      setSongs(prev => [newSong, ...prev]);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (song: Song) => {
    setEditingId(song.id);
    setNewTitle(song.title);
    setNewArtist(song.artist);
    setNewKey(song.key || '');
    setNewBpm(song.bpm?.toString() || '');
    setNewYoutubeUrl(song.youtubeUrl || '');
    setNewStatus(song.status);
    setShowAddModal(true);
  };

  const removeSong = (id: string) => {
    if (confirm('Excluir música?')) {
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateStatus = (id: string, status: SongStatus) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const songsStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const stats: Record<string, { last30Days: number, allKeys: Set<string> }> = {};

    schedules.forEach(sch => {
      if (!sch.date || !Array.isArray(sch.songs)) return;
      
      const schDate = new Date(sch.date);
      const isRecent = schDate >= thirtyDaysAgo;

      sch.songs.forEach(songData => {
        const sId = typeof songData === 'string' ? songData : songData.id;
        const sKey = typeof songData === 'string' ? '' : songData.key;

        if (!stats[sId]) {
          stats[sId] = { last30Days: 0, allKeys: new Set() };
        }

        if (isRecent) {
          stats[sId].last30Days += 1;
        }

        if (sKey) {
          stats[sId].allKeys.add(sKey);
        }
      });
    });

    return stats;
  }, [schedules]);

  const filteredSongs = (songs || []).filter(s => {
    const term = searchTerm.toLowerCase();
    const title = (s.title || "").toLowerCase();
    const artist = (s.artist || "").toLowerCase();
    const matchesSearch = title.includes(term) || artist.includes(term);
    
    // Core logic: filter by tab mode first
    let matchesMode = false;
    if (filterMode === 'repertoire') {
      matchesMode = s.status === SongStatus.READY || s.status === SongStatus.REHEARSING;
      // Secondary internal filter
      if (internalFilter !== 'ALL' && s.status !== internalFilter) matchesMode = false;
    } else {
      matchesMode = s.status === SongStatus.PENDING;
    }

    return matchesSearch && matchesMode;
  });

  const getStatusStyle = (status: SongStatus) => {
    switch (status) {
      case SongStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case SongStatus.REHEARSING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case SongStatus.READY: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: SongStatus) => {
    switch (status) {
      case SongStatus.PENDING: return <Clock size={12} />;
      case SongStatus.REHEARSING: return <PlayCircle size={12} />;
      case SongStatus.READY: return <CheckCircle2 size={12} />;
    }
  };

  const viewTitle = filterMode === 'repertoire' ? 'Repertório' : 'Novas Músicas';
  const viewDesc = filterMode === 'repertoire' 
    ? 'Músicas prontas e em fase de ensaio.' 
    : 'Sugestões e músicas pendentes de avaliação.';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{viewTitle}</h2>
          <p className="text-slate-500 font-medium">{viewDesc}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
          >
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={20} />
          </button>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            {filterMode === 'repertoire' ? 'Adicionar Repertório' : 'Sugerir Música'}
          </button>
        </div>
      </header>

      {/* Modal Adicionar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                {filterMode === 'new' ? <Sparkles className="text-emerald-600" /> : <Music className="text-emerald-600" />}
                {editingId ? 'Editar Música' : filterMode === 'new' ? 'Nova Sugestão' : 'Cadastrar Música'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-300 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSong} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título da Música</label>
                  <input autoFocus type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold transition-all" placeholder="Ex: Hosana" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Artista / Ministério</label>
                  <input type="text" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold transition-all" placeholder="Ex: Hillsong United" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Link do YouTube (Opcional)</label>
                  <div className="relative">
                    <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="url" value={newYoutubeUrl} onChange={(e) => setNewYoutubeUrl(e.target.value)} className="w-full px-12 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-medium transition-all text-sm" placeholder="https://youtube.com/..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tom</label>
                    <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-black text-center uppercase" placeholder="G#" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">BPM</label>
                    <input type="number" value={newBpm} onChange={(e) => setNewBpm(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-center" placeholder="128" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mudar Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(SongStatus).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewStatus(s)}
                        className={`px-3 py-3 rounded-xl text-[10px] font-black transition-all border-2 uppercase ${newStatus === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-6 border-t">
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">
                  {editingId ? 'Salvar Alterações' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder={`Buscar em ${viewTitle.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white border border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-lg font-medium"
          />
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Visualização em Grade"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Visualização em Lista"
          >
            <List size={18} />
          </button>
        </div>
        
        {filterMode === 'repertoire' && (
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setInternalFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${internalFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>TODAS</button>
            <button onClick={() => setInternalFilter(SongStatus.READY)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${internalFilter === SongStatus.READY ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <CheckCircle2 size={12} /> PRONTAS
            </button>
            <button onClick={() => setInternalFilter(SongStatus.REHEARSING)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${internalFilter === SongStatus.REHEARSING ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <PlayCircle size={12} /> ENSAIANDO
            </button>
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          {filterMode === 'repertoire' ? <Library size={20} /> : <Sparkles size={20} />}
          <h3 className="font-black uppercase tracking-widest text-[10px]">{viewTitle} ({filteredSongs.length})</h3>
        </div>

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20" : "flex flex-col gap-3 pb-20"}>
          {filteredSongs.map((song) => {
            const stat = songsStats[song.id] || { last30Days: 0, allKeys: new Set() };
            
            if (viewMode === 'list') {
              return (
                <div key={song.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(song.status).split(' ')[0]}`}>
                    {getStatusIcon(song.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 text-sm truncate">{song.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{song.artist}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 px-4 border-x border-slate-50">
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tom</p>
                      <p className="text-xs font-black text-emerald-600">{song.key || '-'}</p>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                      <p className="text-xs font-black text-slate-800">{song.bpm || '-'}</p>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">30d</p>
                      <p className="text-xs font-black text-emerald-600">{stat.last30Days}x</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {song.youtubeUrl && (
                      <a 
                        href={song.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(song)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => removeSong(song.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={song.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(song.status)}`}>
                    {getStatusIcon(song.status)} {song.status}
                  </div>
                  <div className="flex gap-1">
                    {song.youtubeUrl && (
                      <a 
                        href={song.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Ver Referência"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(song)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => removeSong(song.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 mt-2">
                  <h4 className="font-black text-slate-800 text-xl leading-tight line-clamp-2">{song.title}</h4>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mt-1">{song.artist}</p>
                </div>

                <div className="mt-6 space-y-4 pt-4 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tom Base</p>
                      <p className="font-black text-emerald-600">{song.key || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                      <p className="font-black text-slate-800">{song.bpm || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">30 dias</span>
                    </div>
                    <span className={`text-base font-black ${stat.last30Days > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {stat.last30Days}x
                    </span>
                  </div>

                  {song.youtubeUrl && (
                    <a 
                      href={song.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                    >
                      <ExternalLink size={12} /> Referência YouTube
                    </a>
                  )}

                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mudar Status:</p>
                       <div className="flex gap-1">
                         {Object.values(SongStatus).map(s => (
                           <button 
                             key={s} 
                             onClick={() => updateStatus(song.id, s)} 
                             className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${song.status === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredSongs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
              <Library size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Nenhuma música encontrada</p>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">Não há músicas nesta categoria no momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};