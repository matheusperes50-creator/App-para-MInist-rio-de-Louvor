import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Song, Schedule, SongStatus } from '../types';
import { Music, Search, Trash2, Library, RefreshCw, Calendar, Plus, X, Edit3, CheckCircle2, Clock, PlayCircle, Play, Youtube, ExternalLink, Sparkles, LayoutGrid, List, ArrowDownAZ, ArrowUpAZ, AlertCircle } from 'lucide-react';
import { detectSongKeyAndBpmFromYoutube, extractYoutubeVideoId } from '../services/songDetector';

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

// Helper to extract YouTube video ID from various link formats
export const getYoutubeVideoId = (url?: string): string | null => {
  return extractYoutubeVideoId(url);
};

// Helper to retrieve the official video cover thumbnail from YouTube
export const getYoutubeThumbnail = (url?: string): string | null => {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

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
  
  // Opção de ordenação alfabética ou padrão
  type SortOption = 'default' | 'alpha-asc' | 'alpha-desc' | 'artist-asc';
  const [sortOption, setSortOption] = useState<SortOption>('default');
  
  // States for song form
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newBpm, setNewBpm] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newStatus, setNewStatus] = useState<SongStatus>(filterMode === 'new' ? SongStatus.PENDING : SongStatus.READY);
  const [editingId, setEditingId] = useState<string | null>(null);

  // States for automatic Key and BPM detection from YouTube
  const [isDetectingKeyBpm, setIsDetectingKeyBpm] = useState(false);
  const [detectFeedback, setDetectFeedback] = useState<{ type: 'success' | 'loading' | 'info'; message: string } | null>(null);
  const [autoUpdatedBadges, setAutoUpdatedBadges] = useState<{ key: boolean; bpm: boolean }>({ key: false, bpm: false });
  const lastDetectedUrlRef = useRef<string>('');
  const debounceTimerRef = useRef<any>(null);

  const resetForm = () => {
    setNewTitle('');
    setNewArtist('');
    setNewKey('');
    setNewBpm('');
    setNewYoutubeUrl('');
    setNewStatus(filterMode === 'new' ? SongStatus.PENDING : SongStatus.READY);
    setEditingId(null);
    setDetectFeedback(null);
    setAutoUpdatedBadges({ key: false, bpm: false });
    lastDetectedUrlRef.current = '';
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  };

  const handleDetectKeyAndBpm = async (url: string, isManual = false) => {
    const cleanUrl = url.trim();
    const videoId = extractYoutubeVideoId(cleanUrl);
    if (!videoId) {
      if (isManual) {
        setDetectFeedback({ type: 'info', message: 'Insira um link válido do YouTube para detectar.' });
      }
      return;
    }

    if (!isManual && lastDetectedUrlRef.current === cleanUrl) {
      return;
    }
    lastDetectedUrlRef.current = cleanUrl;

    setIsDetectingKeyBpm(true);
    setDetectFeedback({ type: 'loading', message: 'Analisando vídeo no YouTube e identificando Tom e BPM...' });

    try {
      const result = await detectSongKeyAndBpmFromYoutube(cleanUrl, {
        currentTitle: newTitle,
        currentArtist: newArtist
      });

      if (result && (result.key || result.bpm)) {
        const parts: string[] = [];
        const badgeState: { key: boolean; bpm: boolean } = { key: false, bpm: false };

        if (result.key) {
          setNewKey(result.key);
          parts.push(`Tom: ${result.key}`);
          badgeState.key = true;
        }

        if (result.bpm) {
          setNewBpm(result.bpm.toString());
          parts.push(`BPM: ${result.bpm}`);
          badgeState.bpm = true;
        }

        // Suggest clean title and artist if fields are empty
        if (!newTitle.trim() && result.title) {
          setNewTitle(result.title);
        }
        if (!newArtist.trim() && result.artist) {
          setNewArtist(result.artist);
        }

        setAutoUpdatedBadges(badgeState);
        setDetectFeedback({
          type: 'success',
          message: `✓ Atualizado automaticamente com sucesso (${parts.join(' • ')})!`
        });
      } else {
        setDetectFeedback({
          type: 'info',
          message: 'Vídeo encontrado. Tom e BPM não detectados automaticamente; informe se desejar.'
        });
      }
    } catch (err) {
      console.warn('Erro ao detectar tom e bpm:', err);
      setDetectFeedback({
        type: 'info',
        message: 'Não foi possível analisar o Tom e BPM deste link automaticamente.'
      });
    } finally {
      setIsDetectingKeyBpm(false);
    }
  };

  // Trigger detection automatically when the YouTube link changes or is pasted
  const handleYoutubeChange = (val: string) => {
    setNewYoutubeUrl(val);
    const clean = val.trim();
    const videoId = extractYoutubeVideoId(clean);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (videoId && clean !== lastDetectedUrlRef.current) {
      debounceTimerRef.current = setTimeout(() => {
        handleDetectKeyAndBpm(clean, false);
      }, 650);
    }
  };

  const handleYoutubePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && extractYoutubeVideoId(pastedText.trim())) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      // Run immediately on paste
      setTimeout(() => {
        handleDetectKeyAndBpm(pastedText.trim(), false);
      }, 50);
    }
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
    setDetectFeedback(null);
    setAutoUpdatedBadges({ key: false, bpm: false });
    lastDetectedUrlRef.current = song.youtubeUrl || '';
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

  const filteredSongs = useMemo(() => {
    return (songs || []).filter(s => {
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
  }, [songs, searchTerm, filterMode, internalFilter]);

  const sortedSongs = useMemo(() => {
    const list = [...filteredSongs];
    if (sortOption === 'alpha-asc') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' }));
    }
    if (sortOption === 'alpha-desc') {
      return list.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'pt-BR', { sensitivity: 'base' }));
    }
    if (sortOption === 'artist-asc') {
      return list.sort((a, b) => (a.artist || '').localeCompare(b.artist || '', 'pt-BR', { sensitivity: 'base' }));
    }
    return list;
  }, [filteredSongs, sortOption]);

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

  const viewTitle = filterMode === 'repertoire' ? 'Músicas' : 'Novas Músicas';
  const viewDesc = filterMode === 'repertoire' 
    ? 'Catálogo e repertório de músicas do ministério.' 
    : 'Sugestões e músicas pendentes de avaliação.';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">{viewTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{viewDesc}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            title="Sincronizar dados"
          >
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={20} />
          </button>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg text-xs uppercase tracking-widest cursor-pointer"
          >
            <Plus size={18} />
            {filterMode === 'repertoire' ? 'Cadastrar Música' : 'Sugerir Música'}
          </button>
        </div>
      </header>

      {/* Modal Adicionar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                {filterMode === 'new' ? <Sparkles className="text-emerald-500" /> : <Music className="text-emerald-500" />}
                {editingId ? 'Editar Música' : filterMode === 'new' ? 'Nova Sugestão' : 'Cadastrar Música'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSong} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título da Música</label>
                  <input autoFocus type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold transition-all" placeholder="Ex: Hosana" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Artista / Ministério</label>
                  <input type="text" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold transition-all" placeholder="Ex: Hillsong United" />
                </div>
                {/* Link do YouTube com detecção automática de Tom e BPM */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link do YouTube (Opcional)</label>
                    {newYoutubeUrl && extractYoutubeVideoId(newYoutubeUrl) && (
                      <button
                        type="button"
                        onClick={() => handleDetectKeyAndBpm(newYoutubeUrl, true)}
                        disabled={isDetectingKeyBpm}
                        className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Identificar Tom e BPM a partir do link do YouTube"
                      >
                        <Sparkles size={11} className={isDetectingKeyBpm ? "animate-spin" : ""} />
                        <span>{isDetectingKeyBpm ? 'Identificando...' : 'Re-identificar Tom/BPM'}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                    <input 
                      type="url" 
                      value={newYoutubeUrl} 
                      onChange={(e) => handleYoutubeChange(e.target.value)}
                      onPaste={handleYoutubePaste}
                      onBlur={() => {
                        if (newYoutubeUrl.trim() && extractYoutubeVideoId(newYoutubeUrl.trim()) && (!newKey || !newBpm)) {
                          handleDetectKeyAndBpm(newYoutubeUrl.trim(), false);
                        }
                      }}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-medium transition-all text-sm" 
                      placeholder="Cole o link do YouTube (ex: https://youtu.be/...)" 
                    />
                    {isDetectingKeyBpm && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw size={16} className="text-emerald-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Feedback dinâmico de detecção */}
                  {detectFeedback && (
                    <div className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all animate-in fade-in ${
                      detectFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                        : detectFeedback.type === 'loading'
                        ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {detectFeedback.type === 'success' && <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
                      {detectFeedback.type === 'loading' && <RefreshCw size={14} className="shrink-0 animate-spin text-blue-600 dark:text-blue-400" />}
                      {detectFeedback.type === 'info' && <Sparkles size={14} className="shrink-0 text-amber-500" />}
                      <span className="leading-tight">{detectFeedback.message}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tom Base</label>
                      {autoUpdatedBadges.key && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-0.5 animate-in zoom-in-95">
                          <CheckCircle2 size={9} /> Auto
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={newKey} 
                      onChange={(e) => {
                        setNewKey(e.target.value);
                        setAutoUpdatedBadges(prev => ({ ...prev, key: false }));
                      }} 
                      className={`w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-black text-center uppercase transition-all ${
                        autoUpdatedBadges.key ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-700'
                      }`} 
                      placeholder="G#" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BPM</label>
                      {autoUpdatedBadges.bpm && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-0.5 animate-in zoom-in-95">
                          <CheckCircle2 size={9} /> Auto
                        </span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      value={newBpm} 
                      onChange={(e) => {
                        setNewBpm(e.target.value);
                        setAutoUpdatedBadges(prev => ({ ...prev, bpm: false }));
                      }} 
                      className={`w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold text-center transition-all ${
                        autoUpdatedBadges.bpm ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-700'
                      }`} 
                      placeholder="128" 
                    />
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
                        className={`px-3 py-3 rounded-xl text-[10px] font-black transition-all border-2 uppercase cursor-pointer ${newStatus === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs cursor-pointer">
                  {editingId ? 'Salvar Alterações' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest py-2 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Cancelar</button>
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
            className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-lg font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Ordenação Alfabética */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <button 
              type="button"
              onClick={() => {
                if (sortOption === 'default') setSortOption('alpha-asc');
                else if (sortOption === 'alpha-asc') setSortOption('alpha-desc');
                else setSortOption('default');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                sortOption !== 'default' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={
                sortOption === 'alpha-asc' ? 'Ordem: A a Z (clique para Z a A)' :
                sortOption === 'alpha-desc' ? 'Ordem: Z a A (clique para Padrão)' :
                'Organizar por ordem alfabética'
              }
            >
              {sortOption === 'alpha-desc' ? (
                <>
                  <ArrowUpAZ size={16} />
                  <span>Z → A</span>
                </>
              ) : (
                <>
                  <ArrowDownAZ size={16} />
                  <span>{sortOption === 'alpha-asc' ? 'A → Z' : 'A-Z'}</span>
                </>
              )}
            </button>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 px-2 py-1.5 outline-none cursor-pointer border-l border-slate-100 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              title="Opção de ordenação"
            >
              <option value="default" className="dark:bg-slate-900">Padrão</option>
              <option value="alpha-asc" className="dark:bg-slate-900">A → Z (Título)</option>
              <option value="alpha-desc" className="dark:bg-slate-900">Z → A (Título)</option>
              <option value="artist-asc" className="dark:bg-slate-900">A → Z (Artista)</option>
            </select>
          </div>

          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-slate-800 dark:bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 dark:bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>
          
          {filterMode === 'repertoire' && (
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <button onClick={() => setInternalFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${internalFilter === 'ALL' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>TODAS</button>
              <button onClick={() => setInternalFilter(SongStatus.READY)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 cursor-pointer ${internalFilter === SongStatus.READY ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <CheckCircle2 size={12} /> PRONTAS
              </button>
              <button onClick={() => setInternalFilter(SongStatus.REHEARSING)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 cursor-pointer ${internalFilter === SongStatus.REHEARSING ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <PlayCircle size={12} /> ENSAIANDO
              </button>
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 text-slate-400">
          <div className="flex items-center gap-2">
            {filterMode === 'repertoire' ? <Library size={20} /> : <Sparkles size={20} />}
            <h3 className="font-black uppercase tracking-widest text-[10px]">{viewTitle} ({sortedSongs.length})</h3>
          </div>

          {sortOption !== 'default' && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span>
                {sortOption === 'alpha-asc' ? 'Ordem Alfabética (A-Z)' : sortOption === 'alpha-desc' ? 'Ordem Alfabética (Z-A)' : 'Artista (A-Z)'}
              </span>
              <button 
                onClick={() => setSortOption('default')}
                className="hover:text-red-500 ml-0.5 text-xs font-black"
                title="Restaurar ordem padrão"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20" : "flex flex-col gap-3 pb-20"}>
          {sortedSongs.map((song) => {
            const stat = songsStats[song.id] || { last30Days: 0, allKeys: new Set() };
            const thumbUrl = getYoutubeThumbnail(song.youtubeUrl);
            
            if (viewMode === 'list') {
              return (
                <div key={song.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
                  {thumbUrl ? (
                    <a
                      href={song.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-12 rounded-xl overflow-hidden relative group/thumb shrink-0 border border-slate-100 dark:border-slate-800 shadow-xs block bg-slate-900"
                      title="Assistir no YouTube"
                    >
                      <img src={thumbUrl} alt={song.title} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <Play size={14} className="text-white drop-shadow" fill="white" />
                      </div>
                    </a>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(song.status).split(' ')[0]}`}>
                      {getStatusIcon(song.status)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm truncate">{song.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{song.artist}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 px-4 border-x border-slate-50 dark:border-slate-800">
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tom</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{song.key || '-'}</p>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{song.bpm || '-'}</p>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">30d</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{stat.last30Days}x</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {song.youtubeUrl && (
                      <a 
                        href={song.youtubeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                        title="Ver no YouTube"
                      >
                        <Youtube size={18} />
                      </a>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(song)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all cursor-pointer"><Edit3 size={16} /></button>
                        <button onClick={() => removeSong(song.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={song.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
                {thumbUrl ? (
                  <div className="relative -mx-6 -mt-6 mb-4 aspect-video bg-slate-900 overflow-hidden group/thumb shadow-xs">
                    <img 
                      src={thumbUrl} 
                      alt={song.title} 
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-between p-4">
                      <div className="flex justify-between items-start">
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-md backdrop-blur-xs ${getStatusStyle(song.status)}`}>
                          {getStatusIcon(song.status)} {song.status}
                        </div>
                        {song.youtubeUrl && (
                          <a 
                            href={song.youtubeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                            title="Abrir no YouTube"
                          >
                            <Youtube size={14} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <a 
                          href={song.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-all shadow-sm cursor-pointer"
                        >
                          <Play size={10} fill="currentColor" /> Reproduzir Capa
                        </a>
                        {isAdmin && (
                          <div className="flex gap-1 bg-black/50 backdrop-blur-sm p-1 rounded-xl">
                            <button onClick={() => handleEdit(song)} className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer" title="Editar"><Edit3 size={14} /></button>
                            <button onClick={() => removeSong(song.id)} className="p-1.5 text-white/80 hover:text-red-400 transition-colors cursor-pointer" title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(song.status)}`}>
                      {getStatusIcon(song.status)} {song.status}
                    </div>
                    <div className="flex gap-1">
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(song)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"><Edit3 size={16} /></button>
                          <button onClick={() => removeSong(song.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-1 mt-1">
                  <h4 className="font-black text-slate-800 dark:text-white text-xl leading-tight line-clamp-2">{song.title}</h4>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mt-1">{song.artist}</p>
                </div>

                <div className="mt-5 space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tom Base</p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400">{song.key || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BPM</p>
                      <p className="font-black text-slate-800 dark:text-slate-200">{song.bpm || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">30 dias</span>
                    </div>
                    <span className={`text-base font-black ${stat.last30Days > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                      {stat.last30Days}x
                    </span>
                  </div>

                  {song.youtubeUrl && (
                    <a 
                      href={song.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-100/80 dark:border-red-900/50 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 transition-all shadow-xs"
                    >
                      <Youtube size={14} className="text-red-600 dark:text-red-400" /> Assistir Vídeo no YouTube
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
                             className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase transition-all border cursor-pointer ${song.status === s ? 'bg-slate-800 dark:bg-emerald-600 text-white border-slate-800 dark:border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
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
          
          {sortedSongs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-inner">
              <Library size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Nenhuma música encontrada</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">Não há músicas nesta categoria no momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};