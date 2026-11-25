import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Link2,
  ListMusic,
  MonitorPlay,
  Music,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SkipForward,
  Square,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  HolyricsConfig,
  HolyricsPresentation,
  HolyricsSong,
  Schedule,
  Song,
  SongStatus
} from '../types';
import {
  addSongsToHolyricsPlaylist,
  buildHolyricsBaseUrl,
  closeHolyricsPresentation,
  fetchCurrentPresentation,
  fetchHolyricsPlaylist,
  fetchHolyricsSongs,
  generateWindowsBridgeBatchScript,
  HolyricsErrorType,
  isMixedContentRisk,
  loadHolyricsConfig,
  matchAppSongToHolyrics,
  removeSongFromHolyricsPlaylist,
  saveHolyricsConfig,
  sendHolyricsActionNext,
  sendHolyricsActionPrevious,
  setHolyricsAlert,
  showHolyricsSong,
  showHolyricsVerse,
  showNextPlaylistSong,
  testHolyricsConnection
} from '../services/holyricsService';

interface HolyricsProps {
  schedules: Schedule[];
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  isAdmin: boolean;
  preselectedScheduleId?: string | null;
  onClearPreselectedSchedule?: () => void;
}

type HolyricsTab = 'schedule' | 'remote' | 'catalog' | 'connection';

const CATALOG_CACHE_KEY = 'louvor_holyrics_catalog_cache';

const formatLatinDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const Holyrics: React.FC<HolyricsProps> = ({
  schedules = [],
  songs = [],
  setSongs,
  isAdmin,
  preselectedScheduleId,
  onClearPreselectedSchedule
}) => {
  const [config, setConfig] = useState<HolyricsConfig>(() => loadHolyricsConfig());
  const isConfigured = Boolean(config.host.trim() && config.token.trim());

  const [activeTab, setActiveTab] = useState<HolyricsTab>(() => {
    if (preselectedScheduleId && isConfigured) return 'schedule';
    return isConfigured ? 'schedule' : 'connection';
  });

  const [connectionState, setConnectionState] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionFeedback, setConnectionFeedback] = useState<{
    message: string;
    latencyMs?: number;
    errorType?: HolyricsErrorType;
  } | null>(null);

  const [holyricsSongs, setHolyricsSongs] = useState<HolyricsSong[]>(() => {
    try {
      const cached = localStorage.getItem(CATALOG_CACHE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  const [playlist, setPlaylist] = useState<HolyricsSong[]>([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  const [presentation, setPresentation] = useState<HolyricsPresentation | null>(null);
  const [isLoadingPresentation, setIsLoadingPresentation] = useState(false);

  const sortedSchedules = useMemo(() => {
    return [...(schedules || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [schedules]);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(() => {
    if (preselectedScheduleId) return preselectedScheduleId;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = [...(schedules || [])]
      .filter(s => (s.date || '') >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (upcoming.length > 0) return upcoming[0].id;
    return sortedSchedules[0]?.id || '';
  });

  useEffect(() => {
    if (preselectedScheduleId) {
      setSelectedScheduleId(preselectedScheduleId);
      setActiveTab(isConfigured ? 'schedule' : 'connection');
      onClearPreselectedSchedule?.();
    }
  }, [preselectedScheduleId, isConfigured, onClearPreselectedSchedule]);

  useEffect(() => {
    if (!selectedScheduleId && sortedSchedules.length > 0) {
      setSelectedScheduleId(sortedSchedules[0].id);
    }
  }, [selectedScheduleId, sortedSchedules]);

  const [manualSongMapping, setManualSongMapping] = useState<Record<string, string>>({});
  const [includePostSermon, setIncludePostSermon] = useState<boolean>(true);
  const [isSendingSchedule, setIsSendingSchedule] = useState(false);

  const [alertText, setAlertText] = useState('');
  const [verseInput, setVerseInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const targetPreviewUrl = useMemo(() => buildHolyricsBaseUrl(config), [config]);
  const mixedContentWarning = useMemo(() => {
    const effective = config.bridgeUrl?.trim() || targetPreviewUrl;
    return Boolean(effective && isMixedContentRisk(effective));
  }, [config.bridgeUrl, targetPreviewUrl]);

  const updateConfigField = <K extends keyof HolyricsConfig>(field: K, value: HolyricsConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [field]: value };
      saveHolyricsConfig(next);
      return next;
    });
  };

  const handleTestConnection = async () => {
    saveHolyricsConfig(config);
    setConnectionState('testing');
    setConnectionFeedback(null);

    const res = await testHolyricsConnection(config);
    if (res.ok) {
      setConnectionState('connected');
      setConnectionFeedback({
        message: 'Conexão estabelecida com o Holyrics na rede da igreja.',
        latencyMs: res.latencyMs
      });
      notify('success', 'Conectado ao Holyrics com sucesso!');
      // Refresh catalog and playlist automatically on first successful connect
      if (holyricsSongs.length === 0) {
        handleLoadHolyricsSongs(true);
      }
      handleRefreshPlaylist(true);
    } else {
      setConnectionState('error');
      setConnectionFeedback({
        message: res.error || 'Falha ao conectar com o Holyrics.',
        latencyMs: res.latencyMs,
        errorType: res.errorType
      });
      notify('error', res.error || 'Não foi possível conectar.');
    }
  };

  const handleLoadHolyricsSongs = async (silent = false) => {
    setIsLoadingSongs(true);
    const res = await fetchHolyricsSongs(config);
    setIsLoadingSongs(false);

    if (res.ok && Array.isArray(res.data)) {
      const sorted = [...res.data].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' })
      );
      setHolyricsSongs(sorted);
      setConnectionState('connected');
      try {
        localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(sorted));
      } catch {}
      if (!silent) {
        notify('success', `${sorted.length} músicas carregadas do Holyrics.`);
      }
    } else {
      if (!silent) {
        notify('error', res.error || 'Erro ao buscar músicas do Holyrics.');
      }
    }
  };

  const handleRefreshPlaylist = async (silent = false) => {
    setIsLoadingPlaylist(true);
    const res = await fetchHolyricsPlaylist(config);
    setIsLoadingPlaylist(false);

    if (res.ok && Array.isArray(res.data)) {
      setPlaylist(res.data);
      setConnectionState('connected');
      if (!silent) {
        notify('info', `Playlist atualizada (${res.data.length} músicas na fila).`);
      }
    } else if (!silent) {
      notify('error', res.error || 'Erro ao ler playlist do Holyrics.');
    }
  };

  const handleRefreshPresentation = async (silent = false) => {
    setIsLoadingPresentation(true);
    const res = await fetchCurrentPresentation(config);
    setIsLoadingPresentation(false);

    if (res.ok) {
      setPresentation(res.data || null);
      setConnectionState('connected');
      if (!silent) {
        notify('info', res.data?.title ? `Exibindo: ${res.data.title}` : 'Nenhuma apresentação ativa no momento.');
      }
    } else if (!silent) {
      notify('error', res.error || 'Erro ao ler apresentação atual.');
    }
  };

  const selectedSchedule = useMemo(() => {
    return sortedSchedules.find(s => s.id === selectedScheduleId) || null;
  }, [sortedSchedules, selectedScheduleId]);

  const scheduleSongRows = useMemo(() => {
    if (!selectedSchedule) return [];
    const rows: {
      rowKey: string;
      appSong?: Song;
      title: string;
      key: string;
      isPostSermon: boolean;
      matchedHolyrics: HolyricsSong | null;
      selectedHolyricsId: string;
    }[] = [];

    (selectedSchedule.songs || []).forEach((item, idx) => {
      const sId = typeof item === 'string' ? item : item.id;
      const sKey = typeof item === 'string' ? '' : item.key;
      const appSong = songs.find(s => s.id === sId || s.title.toLowerCase() === sId?.toLowerCase());
      const title = appSong?.title || (typeof item === 'object' ? (item as any).title : '') || sId;
      const rowKey = `${selectedSchedule.id}-${idx}-${sId}`;
      const autoMatch = matchAppSongToHolyrics(appSong, holyricsSongs, title);
      const manualId = manualSongMapping[rowKey];
      const finalId = manualId !== undefined ? manualId : (autoMatch?.id || appSong?.holyricsId || '');
      const matchedHolyrics = holyricsSongs.find(h => h.id === finalId) || autoMatch;

      rows.push({
        rowKey,
        appSong,
        title,
        key: sKey || appSong?.key || '',
        isPostSermon: false,
        matchedHolyrics,
        selectedHolyricsId: finalId
      });
    });

    if (includePostSermon && selectedSchedule.postSermonSong) {
      const ps = selectedSchedule.postSermonSong;
      const psId = typeof ps === 'string' ? ps : ps.id;
      const psKey = typeof ps === 'string' ? '' : ps.key;
      if (psId) {
        const appSong = songs.find(s => s.id === psId || s.title.toLowerCase() === psId.toLowerCase());
        const title = appSong?.title || psId;
        const rowKey = `${selectedSchedule.id}-post-${psId}`;
        const autoMatch = matchAppSongToHolyrics(appSong, holyricsSongs, title);
        const manualId = manualSongMapping[rowKey];
        const finalId = manualId !== undefined ? manualId : (autoMatch?.id || appSong?.holyricsId || '');
        const matchedHolyrics = holyricsSongs.find(h => h.id === finalId) || autoMatch;

        rows.push({
          rowKey,
          appSong,
          title,
          key: psKey || appSong?.key || '',
          isPostSermon: true,
          matchedHolyrics,
          selectedHolyricsId: finalId
        });
      }
    }

    return rows;
  }, [selectedSchedule, songs, holyricsSongs, manualSongMapping, includePostSermon]);

  const handleSendScheduleToHolyrics = async () => {
    const idsToSend = scheduleSongRows
      .map(r => r.selectedHolyricsId)
      .filter(Boolean);

    if (idsToSend.length === 0) {
      notify('error', 'Nenhuma música vinculada ao Holyrics. Carregue o acervo do Holyrics primeiro.');
      return;
    }

    setIsSendingSchedule(true);
    const res = await addSongsToHolyricsPlaylist(config, idsToSend);
    setIsSendingSchedule(false);

    if (res.ok) {
      // Save matched holyricsId onto app songs so future schedules match automatically
      if (isAdmin) {
        const idUpdates = new Map<string, string>();
        scheduleSongRows.forEach(r => {
          if (r.appSong && r.selectedHolyricsId && r.appSong.holyricsId !== r.selectedHolyricsId) {
            idUpdates.set(r.appSong.id, r.selectedHolyricsId);
          }
        });
        if (idUpdates.size > 0) {
          setSongs(prev =>
            prev.map(s => (idUpdates.has(s.id) ? { ...s, holyricsId: idUpdates.get(s.id) } : s))
          );
        }
      }
      notify(
        'success',
        `${idsToSend.length} música(s) enviada(s) para a playlist do Holyrics!`
      );
      if (!res.opaque) {
        handleRefreshPlaylist(true);
      }
    } else {
      notify('error', res.error || 'Erro ao enviar playlist para o Holyrics.');
    }
  };

  const handleShowSongNow = async (holyricsId: string, title?: string, initialIndex = 0) => {
    const res = await showHolyricsSong(config, holyricsId, initialIndex);
    if (res.ok) {
      notify('success', `Projetando "${title || 'música'}" no Holyrics!`);
      if (!res.opaque) {
        setTimeout(() => handleRefreshPresentation(true), 300);
      }
    } else {
      notify('error', res.error || 'Falha ao projetar música.');
    }
  };

  const handleRemoveFromPlaylist = async (index: number) => {
    const res = await removeSongFromHolyricsPlaylist(config, { index });
    if (res.ok) {
      notify('info', 'Música removida da playlist do Holyrics.');
      if (!res.opaque) {
        handleRefreshPlaylist(true);
      } else {
        setPlaylist(prev => prev.filter((_, idx) => idx !== index));
      }
    } else {
      notify('error', res.error || 'Não foi possível remover da playlist.');
    }
  };

  const handleAddSingleToPlaylist = async (song: HolyricsSong) => {
    const res = await addSongsToHolyricsPlaylist(config, [song.id]);
    if (res.ok) {
      notify('success', `"${song.title}" adicionada à playlist do Holyrics.`);
      if (!res.opaque) handleRefreshPlaylist(true);
    } else {
      notify('error', res.error || 'Erro ao adicionar música à playlist.');
    }
  };

  const handleRemoteControl = async (action: 'prev' | 'next' | 'close' | 'next-song') => {
    let res;
    if (action === 'prev') res = await sendHolyricsActionPrevious(config);
    else if (action === 'next') res = await sendHolyricsActionNext(config);
    else if (action === 'close') res = await closeHolyricsPresentation(config);
    else res = await showNextPlaylistSong(config);

    if (res.ok) {
      if (action === 'close') notify('info', 'Projeção fechada no Holyrics.');
      else if (action === 'next-song') notify('success', 'Avançado para a próxima música da playlist.');
      if (!res.opaque) {
        setTimeout(() => handleRefreshPresentation(true), 250);
      }
    } else {
      notify('error', res.error || 'Falha ao enviar comando para o Holyrics.');
    }
  };

  const handleAlertAction = async (show: boolean) => {
    if (show && !alertText.trim()) {
      notify('error', 'Digite o texto do aviso para exibir no telão.');
      return;
    }
    const res = await setHolyricsAlert(config, show ? alertText.trim() : '', show);
    if (res.ok) {
      notify('success', show ? 'Aviso exibido no Holyrics!' : 'Aviso ocultado da tela.');
    } else {
      notify('error', res.error || 'Falha ao enviar aviso.');
    }
  };

  const handleShowVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseInput.trim()) return;
    const res = await showHolyricsVerse(config, verseInput.trim());
    if (res.ok) {
      notify('success', `Versículo "${verseInput.trim()}" enviado para projeção.`);
    } else {
      notify('error', res.error || 'Não foi possível projetar este versículo. Confira a referência (ex: João 3:16).');
    }
  };

  const handleAutoLinkSongs = () => {
    if (holyricsSongs.length === 0) {
      notify('error', 'Carregue o acervo de músicas do Holyrics primeiro.');
      return;
    }
    let linkedCount = 0;
    const updated = songs.map(s => {
      const matched = matchAppSongToHolyrics(s, holyricsSongs);
      if (matched && s.holyricsId !== matched.id) {
        linkedCount++;
        return { ...s, holyricsId: matched.id };
      }
      return s;
    });

    if (linkedCount > 0) {
      setSongs(updated);
      notify('success', `${linkedCount} música(s) vinculada(s) automaticamente com o Holyrics!`);
    } else {
      notify('info', 'Todas as músicas compatíveis já estão vinculadas.');
    }
  };

  const handleToggleImportSelect = (id: string) => {
    setSelectedImportIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportSelectedToApp = () => {
    if (!isAdmin) {
      notify('error', 'Apenas administradores podem importar músicas para o repertório.');
      return;
    }
    if (selectedImportIds.size === 0) return;

    const existingIds = new Set(songs.map(s => s.holyricsId).filter(Boolean));
    const newSongs: Song[] = [];

    holyricsSongs.forEach(hs => {
      if (!selectedImportIds.has(hs.id)) return;
      if (existingIds.has(hs.id)) return;
      newSongs.push({
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        title: hs.title,
        artist: hs.artist || hs.author || 'Holyrics',
        key: hs.key || '',
        bpm: hs.bpm,
        status: SongStatus.READY,
        holyricsId: hs.id
      });
    });

    if (newSongs.length > 0) {
      setSongs(prev => [...newSongs, ...prev]);
      setSelectedImportIds(new Set());
      notify('success', `${newSongs.length} música(s) importada(s) do Holyrics para o repertório!`);
    } else {
      notify('info', 'As músicas selecionadas já estão cadastradas no aplicativo.');
    }
  };

  const handleDownloadBridgeScript = () => {
    const content = generateWindowsBridgeBatchScript(config);
    const blob = new Blob([content], { type: 'application/bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Ponte-Holyrics-Windows.bat';
    a.click();
    URL.revokeObjectURL(url);
    notify('info', 'Script baixado! Execute no computador do Holyrics e preencha http://localhost:8787 no campo Ponte Local.');
  };

  const filteredHolyricsSongs = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return holyricsSongs;
    return holyricsSongs.filter(
      s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.author || '').toLowerCase().includes(q)
    );
  }, [holyricsSongs, catalogSearch]);

  const linkedAppSongByHolyricsId = useMemo(() => {
    const map = new Map<string, Song>();
    songs.forEach(s => {
      if (s.holyricsId) map.set(s.holyricsId, s);
      else {
        const matched = matchAppSongToHolyrics(s, holyricsSongs);
        if (matched && !map.has(matched.id)) map.set(matched.id, s);
      }
    });
    return map;
  }, [songs, holyricsSongs]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border max-w-md animate-in slide-in-from-bottom-4 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-300 shrink-0" />
          ) : (
            <MonitorPlay size={18} className="text-sky-300 shrink-0" />
          )}
          <span className="text-xs font-bold leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <MonitorPlay size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Integração Holyrics (IP Local)
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              <span className="font-mono tabular-nums">
                {targetPreviewUrl ? targetPreviewUrl : 'IP não configurado'}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${
                  connectionState === 'connected'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : connectionState === 'error'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {connectionState === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                {connectionState === 'connected'
                  ? `Conectado${connectionFeedback?.latencyMs ? ` (${connectionFeedback.latencyMs}ms)` : ''}`
                  : connectionState === 'error'
                  ? 'Sem resposta do PC'
                  : 'Aguardando teste'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionState === 'testing'}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw size={15} className={connectionState === 'testing' ? 'animate-spin' : ''} />
            {connectionState === 'testing' ? 'Testando...' : 'Testar Conexão IP'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Settings2 size={15} /> Configurar IP
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {[
          { id: 'schedule' as HolyricsTab, label: 'Enviar Escala', icon: ListMusic },
          { id: 'remote' as HolyricsTab, label: 'Controle ao Vivo', icon: Radio },
          { id: 'catalog' as HolyricsTab, label: `Acervo Holyrics (${holyricsSongs.length})`, icon: Music },
          { id: 'connection' as HolyricsTab, label: 'Conexão IP', icon: Wifi }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ENVIAR ESCALA & PLAYLIST */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Escala -> Holyrics */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Enviar Repertório da Escala para o Holyrics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecione o culto e envie as músicas diretamente para a lista de reprodução do Holyrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLoadHolyricsSongs(false)}
                disabled={isLoadingSongs || !isConfigured}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={isLoadingSongs ? 'animate-spin' : ''} />
                Sincronizar Acervo ({holyricsSongs.length})
              </button>
            </div>

            {!isConfigured && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between gap-3">
                <span>Configure o IP, porta e token do Holyrics antes de enviar as escalas.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('connection')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Configurar IP
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Escala / Culto
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={e => setSelectedScheduleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {sortedSchedules.length === 0 && (
                    <option value="">Nenhuma escala cadastrada</option>
                  )}
                  {sortedSchedules.map(sch => (
                    <option key={sch.id} value={sch.id} className="dark:bg-slate-900">
                      {formatLatinDate(sch.date)} - {sch.serviceType} ({sch.songs?.length || 0} músicas)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePostSermon}
                    onChange={e => setIncludePostSermon(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-600"
                  />
                  Incluir música pós-pregação (se houver)
                </label>
              </div>
            </div>

            {holyricsSongs.length === 0 && isConfigured && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Carregue o acervo de músicas do computador da igreja para vincular automaticamente os títulos desta escala.
                </p>
                <button
                  type="button"
                  onClick={() => handleLoadHolyricsSongs(false)}
                  disabled={isLoadingSongs}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isLoadingSongs ? 'Carregando...' : 'Carregar Músicas do PC'}
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {scheduleSongRows.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Esta escala ainda não possui músicas no repertório.
                </div>
              ) : (
                scheduleSongRows.map((row, index) => (
                  <div
                    key={row.rowKey}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono tabular-nums font-bold">#{index + 1}</span>
                        {row.key && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Tom {row.key}</span>
                          </>
                        )}
                        {row.isPostSermon && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Pós-pregação</span>
                          </>
                        )}
                      </div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                        {row.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {holyricsSongs.length > 0 ? (
                        <select
                          value={row.selectedHolyricsId}
                          onChange={e =>
                            setManualSongMapping(prev => ({ ...prev, [row.rowKey]: e.target.value }))
                          }
                          className={`max-w-[230px] px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                            row.selectedHolyricsId
                              ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-700 text-slate-800 dark:text-slate-100'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          <option value="" className="dark:bg-slate-900">
                            -- Não vinculada no Holyrics --
                          </option>
                          {holyricsSongs.map(hs => (
                            <option key={hs.id} value={hs.id} className="dark:bg-slate-900">
                              {hs.title} {hs.artist ? `(${hs.artist})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : row.selectedHolyricsId ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Link2 size={14} /> ID {row.selectedHolyricsId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sem vínculo</span>
                      )}

                      {row.selectedHolyricsId && (
                        <button
                          type="button"
                          onClick={() => handleShowSongNow(row.selectedHolyricsId, row.title)}
                          title="Projetar letra agora no telão"
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          <Play size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {scheduleSongRows.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                  {scheduleSongRows.filter(r => Boolean(r.selectedHolyricsId)).length} de {scheduleSongRows.length} músicas prontas para envio
                </span>
                <button
                  type="button"
                  onClick={handleSendScheduleToHolyrics}
                  disabled={isSendingSchedule || !isConfigured}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send size={15} />
                  {isSendingSchedule ? 'Enviando...' : 'Enviar Escala para Playlist do Holyrics'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Playlist Atual do Holyrics */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Playlist Atual no Holyrics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {playlist.length} música(s) na fila do culto
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRefreshPlaylist(false)}
                disabled={isLoadingPlaylist || !isConfigured}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"
                title="Atualizar playlist do Holyrics"
              >
                <RefreshCw size={15} className={isLoadingPlaylist ? 'animate-spin' : ''} />
              </button>
            </div>

            {playlist.length === 0 ? (
              <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <ListMusic size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                  Nenhuma música carregada da playlist. Clique em atualizar ou envie uma escala ao lado.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                {playlist.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        <span className="font-mono tabular-nums text-slate-400 mr-1.5">{idx + 1}.</span>
                        {item.title}
                      </p>
                      {(item.artist || item.key) && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {[item.artist, item.key ? `Tom ${item.key}` : ''].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleShowSongNow(item.id, item.title)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        title="Projetar letra agora"
                      >
                        <Play size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromPlaylist(idx)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover da playlist"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTROLE AO VIVO */}
      {activeTab === 'remote' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Slide controls + Live preview */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Controle Remoto de Projeção
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Avance slides, troque de música ou feche a tela direto pelo Wi-Fi da igreja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRefreshPresentation(false)}
                disabled={isLoadingPresentation || !isConfigured}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={isLoadingPresentation ? 'animate-spin' : ''} />
                Ler Tela Atual
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleRemoteControl('prev')}
                disabled={!isConfigured}
                className="py-4 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <ChevronLeft size={22} />
                <span>Slide Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoteControl('next')}
                disabled={!isConfigured}
                className="py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <ChevronRight size={22} />
                <span>Próximo Slide</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoteControl('next-song')}
                disabled={!isConfigured}
                className="py-4 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <SkipForward size={22} />
                <span>Próxima Música</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoteControl('close')}
                disabled={!isConfigured}
                className="py-4 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex flex-col items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Square size={20} />
                <span>Fechar Tela</span>
              </button>
            </div>

            {/* Active Presentation Slides */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {presentation?.title
                    ? `Projetando agora: ${presentation.title}`
                    : 'Slides da apresentação atual'}
                </span>
                {typeof presentation?.slide_index === 'number' && typeof presentation?.total_slides === 'number' && (
                  <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Slide {presentation.slide_index + 1} / {presentation.total_slides}
                  </span>
                )}
              </div>

              {presentation?.slides && presentation.slides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                  {presentation.slides.map((slide, sIdx) => {
                    const isCurrent = presentation.slide_index === sIdx;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          if (presentation.id) {
                            handleShowSongNow(presentation.id, presentation.title, sIdx);
                          }
                        }}
                        className={`p-3.5 rounded-2xl text-left border transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 mb-1">
                          <span>Slide {sIdx + 1}</span>
                          {slide.description && <span>{slide.description}</span>}
                        </div>
                        <p className="text-xs whitespace-pre-line line-clamp-4 font-medium leading-relaxed">
                          {slide.text || '(Slide vazio)'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Clique em "Ler Tela Atual" para visualizar a letra que está sendo projetada no telão.
                </div>
              )}
            </div>
          </div>

          {/* Right: Alerts & Bible Verses */}
          <div className="lg:col-span-5 space-y-6">
            {/* Alert message */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Aviso Rápido no Telão
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Exiba um recado ou chamado discreto na tela da projeção (SetAlert).
                </p>
              </div>

              <textarea
                rows={3}
                value={alertText}
                onChange={e => setAlertText(e.target.value)}
                placeholder="Ex: Pais do berçário, favor comparecer à sala infantil."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-emerald-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAlertAction(true)}
                  disabled={!isConfigured}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Mostrar Aviso
                </button>
                <button
                  type="button"
                  onClick={() => handleAlertAction(false)}
                  disabled={!isConfigured}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Ocultar
                </button>
              </div>
            </div>

            {/* Verse projection */}
            <form
              onSubmit={handleShowVerse}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Projetar Versículo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Envie uma referência bíblica diretamente para o Holyrics.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={verseInput}
                  onChange={e => setVerseInput(e.target.value)}
                  placeholder="Ex: João 3:16 ou Salmos 23:1-3"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!isConfigured || !verseInput.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Projetar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: ACERVO DE MÚSICAS */}
      {activeTab === 'catalog' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Acervo de Músicas do Holyrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {holyricsSongs.length} música(s) carregadas do computador da igreja
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadHolyricsSongs(false)}
                disabled={isLoadingSongs || !isConfigured}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw size={14} className={isLoadingSongs ? 'animate-spin' : ''} />
                {isLoadingSongs ? 'Buscando...' : 'Buscar do Holyrics'}
              </button>

              {isAdmin && holyricsSongs.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoLinkSongs}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Link2 size={14} /> Vincular com Repertório
                </button>
              )}

              {isAdmin && selectedImportIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleImportSelectedToApp}
                  className="px-4 py-2 bg-slate-900 dark:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download size={14} /> Importar ({selectedImportIds.size}) para o App
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Buscar música ou artista no banco do Holyrics..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          {holyricsSongs.length === 0 ? (
            <div className="py-14 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Music size={34} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique em "Buscar do Holyrics" para listar todas as músicas cadastradas no computador da igreja.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto pr-1 no-scrollbar">
              {filteredHolyricsSongs.map(hs => {
                const appMatch = linkedAppSongByHolyricsId.get(hs.id);
                const isSelectedForImport = selectedImportIds.has(hs.id);
                return (
                  <div
                    key={hs.id}
                    className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {isAdmin && !appMatch && (
                        <input
                          type="checkbox"
                          checked={isSelectedForImport}
                          onChange={() => handleToggleImportSelect(hs.id)}
                          className="mt-1 w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-600 cursor-pointer"
                          title="Selecionar para importar ao app"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {hs.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{hs.artist || hs.author || 'Sem artista'}</span>
                          {hs.key && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Tom {hs.key}</span>
                            </>
                          )}
                          {hs.bpm && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{hs.bpm} BPM</span>
                            </>
                          )}
                          {appMatch && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                No repertório do app
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddSingleToPlaylist(hs)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Playlist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShowSongNow(hs.id, hs.title)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Play size={13} /> Projetar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONEXÃO IP */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Endereço IP e Credenciais do Holyrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Informe o IP do computador da igreja na rede Wi-Fi, a porta do API Server e o token de permissão.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Protocolo</label>
                <select
                  value={config.protocol}
                  onChange={e => updateConfigField('protocol', e.target.value as 'http' | 'https')}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-emerald-500"
                >
                  <option value="http" className="dark:bg-slate-900">http:// (Rede Local)</option>
                  <option value="https" className="dark:bg-slate-900">https:// (Túnel/SSL)</option>
                </select>
              </div>

              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  IP do Computador ou Domínio
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={e => updateConfigField('host', e.target.value)}
                  placeholder="Ex: 192.168.1.50"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Porta</label>
                <input
                  type="text"
                  value={config.port}
                  onChange={e => updateConfigField('port', e.target.value.replace(/\D/g, ''))}
                  placeholder="8080"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tabular-nums font-bold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Token de Acesso (API Server &gt; Gerenciar Permissões)
              </label>
              <input
                type="password"
                value={config.token}
                onChange={e => updateConfigField('token', e.target.value)}
                placeholder="Cole aqui o token gerado dentro do Holyrics"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Ponte Local / Túnel HTTPS (opcional)
              </label>
              <input
                type="text"
                value={config.bridgeUrl || ''}
                onChange={e => updateConfigField('bridgeUrl', e.target.value)}
                placeholder="Ex: http://localhost:8787 ou https://holyrics-igreja.trycloudflare.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Deixe em branco para conectar direto ao IP acima. Use caso o navegador bloqueie CORS/HTTPS ao acessar a rede local.
              </p>
            </div>

            {mixedContentWarning && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  Atenção ao acesso HTTPS para IP local (HTTP)
                </p>
                <p className="leading-relaxed">
                  Como o app está rodando em <strong>https://</strong>, navegadores bloqueiam chamadas diretas para IPs <strong>http://192.168.x.x</strong> por segurança. Para conectar no culto, use uma destas opções:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No computador do Holyrics, baixe e execute a <strong>Ponte Local Windows</strong> ao lado e coloque <code className="font-mono bg-white/70 dark:bg-slate-900 px-1 rounded">http://localhost:8787</code> em Ponte Local;</li>
                  <li>Ou libere <strong>Conteúdo não seguro</strong> nas configurações deste site no Chrome/Edge;</li>
                  <li>Ou exponha a porta do Holyrics com um túnel HTTPS (Cloudflare Tunnel / Tailscale / ngrok).</li>
                </ul>
              </div>
            )}

            {connectionFeedback && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  connectionState === 'connected'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <p className="font-bold flex items-center gap-2">
                  {connectionState === 'connected' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {connectionState === 'connected' ? 'Conexão ativa' : 'Erro na conexão'}
                </p>
                <p>{connectionFeedback.message}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionState === 'testing'}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Wifi size={15} />
                {connectionState === 'testing' ? 'Testando Conexão...' : 'Salvar e Testar Conexão'}
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(v => !v)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle size={15} />
                {showGuide ? 'Ocultar Tutorial' : 'Como ativar no Holyrics'}
              </button>
            </div>
          </div>

          {/* Right: Tutorial & Bridge Download */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                Passo a passo no PC da Igreja
              </h3>
              <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-decimal pl-4">
                <li>
                  No Holyrics, acesse <strong>Arquivo &gt; Configurações &gt; API Server</strong>.
                </li>
                <li>
                  Ative a opção <strong>API server - Local</strong> e defina uma porta livre (ex: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">8080</code>).
                </li>
                <li>
                  Clique em <strong>Gerenciar Permissões</strong>, crie um novo token e marque permissões de músicas, playlists, apresentação e avisos.
                </li>
                <li>
                  Descubra o IP do computador no Windows abrindo o Prompt (<code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">cmd</code>) e digitando <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ipconfig</code> (use o <strong>Endereço IPv4</strong>, ex: <span className="font-mono">192.168.1.50</span>).
                </li>
              </ol>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Ponte Local para Windows (Opcional)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Se o navegador bloquear a comunicação direta por política CORS/HTTPS ao abrir o app no computador da igreja, baixe este arquivo e execute-o com dois cliques no Windows (não requer instalação).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBridgeScript}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download size={15} />
                Baixar Ponte-Holyrics-Windows.bat
              </button>
            </div>

            {showGuide && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">Dicas de Firewall</p>
                <p className="leading-relaxed">
                  Caso o computador da projeção não responda no IP local, certifique-se de que a rede Wi-Fi do Windows está marcada como <strong>Rede Privada</strong> e que o Firewall do Windows permite conexões de entrada para o Java / Holyrics na porta configurada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
