import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Songs } from './components/Songs';
import { Schedules } from './components/Schedules';
import { LookStyle } from './components/LookStyle';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { Events } from './components/Events';
import { AutoSchedules } from './components/AutoSchedules';
import { Notes } from './components/Notes';
import { Attendance } from './components/Attendance';
import { Member, Song, Schedule, ViewType, UserRoleType, SongStatus, ExternalEvent, LookStyle as LookStyleType, RehearsalNote, AttendanceEvent } from './types';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, LogOut, History, Download, Upload, X, ShieldAlert, ShieldCheck, FileSpreadsheet, RotateCcw, Database } from 'lucide-react';
import { 
  DEFAULT_MEMBERS, 
  DEFAULT_SONGS, 
  DEFAULT_SCHEDULES, 
  DEFAULT_STYLES, 
  DEFAULT_NOTES, 
  DEFAULT_EVENTS, 
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_ATTENDANCE_EVENTS
} from './initialData';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeUYtQd3mDz6cBQxTrJm_jPcV-_ywtI7yxWOQNdfKKFprEXouHdlbUshccSy2DF34I/exec';

// Check if current URL directs straight to attendance
const checkIsAttendanceDirectLink = () => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = (urlParams.get('view') || urlParams.get('aba') || urlParams.get('page') || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  return viewParam === 'presenca' || viewParam === 'attendance' || hash.includes('presenca') || hash.includes('attendance');
};

export const App: React.FC = () => {
  const isDirectAttendance = checkIsAttendanceDirectLink();
  const [view, setView] = useState<ViewType>(() => isDirectAttendance ? 'attendance' : 'dashboard');
  const [userRole, setUserRole] = useState<UserRoleType>(() => isDirectAttendance ? 'member' : 'guest');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasFetchedFromCloud, setHasFetchedFromCloud] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  // Synchronize view with URL query/hash changes
  useEffect(() => {
    const handleUrlChange = () => {
      if (checkIsAttendanceDirectLink()) {
        setView('attendance');
        setUserRole(prev => prev === 'guest' ? 'member' : prev);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);
  
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_members');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_MEMBERS;
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_songs');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any) => ({ ...s, status: s.status || SongStatus.READY }));
      }
    } catch {}
    return DEFAULT_SONGS;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_schedules');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_SCHEDULES;
  });

  const [events, setEvents] = useState<ExternalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_events');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_EVENTS;
  });

  const [styles, setStyles] = useState<LookStyleType[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_styles');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_STYLES;
  });

  const [notes, setNotes] = useState<RehearsalNote[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_notes');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_NOTES;
  });

  const [announcements, setAnnouncements] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('louvor_announcements');
      if (saved && saved.trim()) return saved;
    } catch {}
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_attendance');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_ATTENDANCE_EVENTS;
  });

  // Keep live references to state
  const membersRef = useRef(members);
  const songsRef = useRef(songs);
  const schedulesRef = useRef(schedules);
  const eventsRef = useRef(events);
  const stylesRef = useRef(styles);
  const notesRef = useRef(notes);
  const announcementsRef = useRef(announcements);
  const attendanceEventsRef = useRef(attendanceEvents);

  useEffect(() => { membersRef.current = members; }, [members]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { schedulesRef.current = schedules; }, [schedules]);
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { stylesRef.current = styles; }, [styles]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { announcementsRef.current = announcements; }, [announcements]);
  useEffect(() => { attendanceEventsRef.current = attendanceEvents; }, [attendanceEvents]);

  // Sync state to localStorage immediately whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('louvor_members', JSON.stringify(members));
      localStorage.setItem('louvor_songs', JSON.stringify(songs));
      localStorage.setItem('louvor_schedules', JSON.stringify(schedules));
      localStorage.setItem('louvor_events', JSON.stringify(events));
      localStorage.setItem('louvor_styles', JSON.stringify(styles));
      localStorage.setItem('louvor_notes', JSON.stringify(notes));
      localStorage.setItem('louvor_announcements', announcements);
      localStorage.setItem('louvor_attendance', JSON.stringify(attendanceEvents));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }
  }, [members, songs, schedules, events, styles, notes, announcements, attendanceEvents]);

  const handleLogin = (role: UserRoleType) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole('guest');
  };

  // Immediate cloud save function - saves locally and pushes to Google Sheets
  const saveToCloudNow = useCallback(async (overridePayload?: {
    members?: Member[];
    songs?: Song[];
    schedules?: Schedule[];
    events?: ExternalEvent[];
    styles?: LookStyleType[];
    notes?: RehearsalNote[];
    announcements?: string;
    attendanceEvents?: AttendanceEvent[];
  }) => {
    // Only admins can modify core data; members are permitted to save attendance votes
    if (userRole !== 'admin' && !overridePayload?.attendanceEvents) return;

    setIsSyncing(true);
    setSyncStatus('idle');

    const targetMembers = overridePayload?.members ?? membersRef.current ?? [];
    const targetSongs = overridePayload?.songs ?? songsRef.current ?? [];
    const targetSchedules = overridePayload?.schedules ?? schedulesRef.current ?? [];
    const targetEvents = overridePayload?.events ?? eventsRef.current ?? [];
    const targetStyles = overridePayload?.styles ?? stylesRef.current ?? [];
    const targetNotes = overridePayload?.notes ?? notesRef.current ?? [];
    const targetAnnouncements = overridePayload?.announcements ?? announcementsRef.current ?? '';
    const targetAttendanceEvents = overridePayload?.attendanceEvents ?? attendanceEventsRef.current ?? [];

    // 1. Immediately persist to localStorage for instant local reliability
    try {
      if (overridePayload?.members) localStorage.setItem('louvor_members', JSON.stringify(targetMembers));
      if (overridePayload?.songs) localStorage.setItem('louvor_songs', JSON.stringify(targetSongs));
      if (overridePayload?.schedules) localStorage.setItem('louvor_schedules', JSON.stringify(targetSchedules));
      if (overridePayload?.events) localStorage.setItem('louvor_events', JSON.stringify(targetEvents));
      if (overridePayload?.styles) localStorage.setItem('louvor_styles', JSON.stringify(targetStyles));
      if (overridePayload?.notes) localStorage.setItem('louvor_notes', JSON.stringify(targetNotes));
      if (overridePayload?.announcements !== undefined) localStorage.setItem('louvor_announcements', targetAnnouncements);
      if (overridePayload?.attendanceEvents) localStorage.setItem('louvor_attendance', JSON.stringify(targetAttendanceEvents));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }

    // 2. Immediately update state if override passed
    if (overridePayload?.members) setMembers(targetMembers);
    if (overridePayload?.songs) setSongs(targetSongs);
    if (overridePayload?.schedules) setSchedules(targetSchedules);
    if (overridePayload?.events) setEvents(targetEvents);
    if (overridePayload?.styles) setStyles(targetStyles);
    if (overridePayload?.notes) setNotes(targetNotes);
    if (overridePayload?.announcements !== undefined) setAnnouncements(targetAnnouncements);
    if (overridePayload?.attendanceEvents) setAttendanceEvents(targetAttendanceEvents);

    // 3. Post to Google Sheets Apps Script
    try {
      const payload = {
        members: targetMembers,
        songs: targetSongs,
        schedules: targetSchedules,
        events: targetEvents,
        styles: targetStyles,
        notes: targetNotes,
        announcements: targetAnnouncements,
        attendanceEvents: targetAttendanceEvents
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setSyncStatus('success');
    } catch (error) {
      console.error('Erro ao salvar na nuvem:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [userRole]);

  // SYNC FROM SHEETS:
  // Reads cloud data and safely merges it with state and localStorage.
  const syncFromSheets = useCallback(async (isAuto = false, forceReplace = false) => {
    if (!isAuto) setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('Falha HTTP ao conectar com a planilha:', response.status);
        if (!isAuto) setSyncStatus('error');
        return;
      }

      const text = await response.text();
      let data: any = null;
      try {
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          data = JSON.parse(trimmed);
        }
      } catch (parseErr) {
        console.warn('Dados recebidos da planilha não são JSON válido, mantendo dados locais intactos:', parseErr);
        if (!isAuto) setSyncStatus('error');
        return;
      }

      if (data && typeof data === 'object') {
        // Members: apply from cloud only if non-empty array
        if (Array.isArray(data.members) && data.members.length > 0) {
          setMembers(data.members);
          try {
            localStorage.setItem('louvor_members', JSON.stringify(data.members));
          } catch (e) {}
        }

        // Songs: apply from cloud only if non-empty array
        if (Array.isArray(data.songs) && data.songs.length > 0) {
          const validSongs = data.songs.map((s: any) => ({
            ...s,
            status: s.status || SongStatus.READY
          }));
          setSongs(validSongs);
          try {
            localStorage.setItem('louvor_songs', JSON.stringify(validSongs));
          } catch (e) {}
        }

        // Schedules: merge cloud with locally created schedules so user work is never wiped
        if (Array.isArray(data.schedules) && data.schedules.length > 0) {
          if (forceReplace) {
            setSchedules(data.schedules);
            try {
              localStorage.setItem('louvor_schedules', JSON.stringify(data.schedules));
            } catch (e) {}
          } else {
            setSchedules(prev => {
              const current = prev || [];
              const cloudIds = new Set(data.schedules.map((s: any) => s.id));
              const localOnly = current.filter(s => s && s.id && !cloudIds.has(s.id));
              const merged = [...localOnly, ...data.schedules].sort((a, b) => 
                (b.date || '').localeCompare(a.date || '')
              );
              try {
                localStorage.setItem('louvor_schedules', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }

        // Attendance: merge cloud attendance events if available
        const cloudAttendance = Array.isArray(data.attendanceEvents) ? data.attendanceEvents : (Array.isArray(data.attendance) ? data.attendance : null);
        if (cloudAttendance && cloudAttendance.length > 0) {
          if (forceReplace) {
            setAttendanceEvents(cloudAttendance);
            try {
              localStorage.setItem('louvor_attendance', JSON.stringify(cloudAttendance));
            } catch (e) {}
          } else {
            setAttendanceEvents(prev => {
              const current = prev || [];
              const cloudIds = new Set(cloudAttendance.map((e: any) => e.id));
              const localOnly = current.filter(e => e && e.id && !cloudIds.has(e.id));
              const merged = [...localOnly, ...cloudAttendance].sort((a, b) => 
                (b.date || '').localeCompare(a.date || '')
              );
              try {
                localStorage.setItem('louvor_attendance', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }

        // Events: apply from cloud only if non-empty array
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
          try {
            localStorage.setItem('louvor_events', JSON.stringify(data.events));
          } catch (e) {}
        }

        // Notes: apply from cloud only if non-empty array
        if (Array.isArray(data.notes) && data.notes.length > 0) {
          setNotes(data.notes);
          try {
            localStorage.setItem('louvor_notes', JSON.stringify(data.notes));
          } catch (e) {}
        }

        // Styles: apply from cloud only if non-empty array
        if (Array.isArray(data.styles) && data.styles.length > 0) {
          setStyles(data.styles);
          try {
            localStorage.setItem('louvor_styles', JSON.stringify(data.styles));
          } catch (e) {}
        }

        // Announcements: apply from cloud only if non-empty
        if (typeof data.announcements === 'string' && data.announcements.trim()) {
          setAnnouncements(data.announcements);
          try {
            localStorage.setItem('louvor_announcements', data.announcements);
          } catch (e) {}
        }

        setHasFetchedFromCloud(true);
        if (!isAuto) setSyncStatus('success');
      }
    } catch (error) {
      console.warn('Erro ao sincronizar da nuvem:', error);
      if (!isAuto) setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      if (!isAuto) setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  // Full manual sync
  const handleManualSync = useCallback(async () => {
    await syncFromSheets(false);
  }, [syncFromSheets]);

  // Initial cloud fetch from Google Sheets database immediately on initial mount
  useEffect(() => {
    syncFromSheets(true);
  }, [syncFromSheets]);

  const handleUpdateAnnouncements = useCallback((val: string) => {
    setAnnouncements(val);
    try {
      localStorage.setItem('louvor_announcements', val);
    } catch (e) {}
    if (userRole === 'admin') {
      saveToCloudNow({ announcements: val });
    }
  }, [userRole, saveToCloudNow]);

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      members,
      songs,
      schedules,
      events,
      styles,
      notes,
      announcements,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_louvor_pibje_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setRestoreFeedback('Backup JSON exportado com sucesso!');
    setTimeout(() => setRestoreFeedback(null), 3500);
  };

  // Import full JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.members)) setMembers(parsed.members);
          if (Array.isArray(parsed.songs)) setSongs(parsed.songs);
          if (Array.isArray(parsed.schedules)) setSchedules(parsed.schedules);
          if (Array.isArray(parsed.events)) setEvents(parsed.events);
          if (Array.isArray(parsed.styles)) setStyles(parsed.styles);
          if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
          if (typeof parsed.announcements === 'string') setAnnouncements(parsed.announcements);

          setRestoreFeedback('Backup importado com sucesso! Sincronizando com a nuvem...');
          if (userRole === 'admin') {
            await saveToCloudNow(parsed);
          }
          setTimeout(() => {
            setRestoreFeedback(null);
            setShowRestoreModal(false);
          }, 2500);
        }
      } catch (err) {
        setRestoreFeedback('Erro ao ler arquivo de backup. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Reset all to default official PIBJE ministry data
  const handleResetToDefaultMinistryData = async () => {
    setMembers(DEFAULT_MEMBERS);
    setSongs(DEFAULT_SONGS);
    setSchedules(DEFAULT_SCHEDULES);
    setEvents(DEFAULT_EVENTS);
    setStyles(DEFAULT_STYLES);
    setNotes(DEFAULT_NOTES);
    setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    setAttendanceEvents(DEFAULT_ATTENDANCE_EVENTS);

    try {
      localStorage.setItem('louvor_members', JSON.stringify(DEFAULT_MEMBERS));
      localStorage.setItem('louvor_songs', JSON.stringify(DEFAULT_SONGS));
      localStorage.setItem('louvor_schedules', JSON.stringify(DEFAULT_SCHEDULES));
      localStorage.setItem('louvor_events', JSON.stringify(DEFAULT_EVENTS));
      localStorage.setItem('louvor_styles', JSON.stringify(DEFAULT_STYLES));
      localStorage.setItem('louvor_notes', JSON.stringify(DEFAULT_NOTES));
      localStorage.setItem('louvor_announcements', DEFAULT_ANNOUNCEMENTS);
      localStorage.setItem('louvor_attendance', JSON.stringify(DEFAULT_ATTENDANCE_EVENTS));
    } catch (e) {}

    setRestoreFeedback('Dados oficiais do Ministério PIBJE restaurados com sucesso! Sincronizando com a nuvem...');
    if (userRole === 'admin') {
      await saveToCloudNow({
        members: DEFAULT_MEMBERS,
        songs: DEFAULT_SONGS,
        schedules: DEFAULT_SCHEDULES,
        events: DEFAULT_EVENTS,
        styles: DEFAULT_STYLES,
        notes: DEFAULT_NOTES,
        announcements: DEFAULT_ANNOUNCEMENTS
      });
    }
    setTimeout(() => {
      setRestoreFeedback(null);
      setShowRestoreModal(false);
    }, 2200);
  };

  if (userRole === 'guest') {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const isAdmin = userRole === 'admin';
    const syncProps = { 
      onSync: handleManualSync, 
      onSaveToCloud: saveToCloudNow, 
      isSyncing, 
      isAdmin 
    };

    switch (view) {
      case 'dashboard': 
        return <Dashboard members={members} songs={songs} schedules={schedules} announcements={announcements} setAnnouncements={handleUpdateAnnouncements} {...syncProps} />;
      case 'attendance':
        return (
          <Attendance 
            attendanceEvents={attendanceEvents} 
            setAttendanceEvents={setAttendanceEvents} 
            members={members} 
            schedules={schedules} 
            setSchedules={setSchedules} 
            setView={setView} 
            {...syncProps} 
          />
        );
      case 'members': 
        return <Members members={members} setMembers={setMembers} {...syncProps} />;
      case 'songs': 
        return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="repertoire" {...syncProps} />;
      case 'new-songs': 
        return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="new" {...syncProps} />;
      case 'schedules': 
        return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} setSongs={setSongs} {...syncProps} />;
      case 'reports': 
        return <Reports schedules={schedules} members={members} songs={songs} events={events} />;
      case 'events': 
        return <Events events={events} setEvents={setEvents} members={members} songs={songs} isAdmin={isAdmin} />;
      case 'style': 
        return <LookStyle styles={styles} setStyles={setStyles} {...syncProps} />;
      case 'auto-schedules': 
        return <AutoSchedules schedules={schedules} setSchedules={setSchedules} members={members} setView={setView} attendanceEvents={attendanceEvents} {...syncProps} />;
      case 'notes': 
        return <Notes notes={notes} setNotes={setNotes} songs={songs} {...syncProps} />;
      default: 
        return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userRole={userRole}>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${hasFetchedFromCloud ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Cloud size={12} /> {hasFetchedFromCloud ? 'Conectado à Planilha' : 'Offline / Local'}
          </div>

          {isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <RefreshCw size={12} className="animate-spin" /> Sincronizando...
            </div>
          )}
          {syncStatus === 'success' && !isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 size={12} /> Salvo e Sincronizado
            </div>
          )}
          {syncStatus === 'error' && !isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              <AlertCircle size={12} /> Erro de conexão
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              syncFromSheets(false);
              setRestoreFeedback('Buscando e recarregando os dados oficiais da planilha Google...');
              setTimeout(() => setRestoreFeedback(null), 3500);
            }}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-[9px] font-black text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-full uppercase tracking-widest transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Recarregar dados originais e oficiais da Planilha Google (descarta dados de teste temporários)"
          >
            <Database size={12} className={isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'} /> 
            Recarregar Planilha Oficial
          </button>

          <button 
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full uppercase tracking-widest transition-all cursor-pointer shadow-sm"
            title="Recuperar dados anteriores ou restaurar versão"
          >
            <History size={12} /> Backup / Histórico
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Sair <LogOut size={12} />
          </button>
        </div>
      </div>

      {renderContent()}

      {/* RESTORE / BACKUP MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-8 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowRestoreModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recuperação e Backup de Dados</h3>
                <p className="text-xs text-slate-500 font-medium">Restaure o histórico da planilha ou importe um backup</p>
              </div>
            </div>

            {restoreFeedback && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {restoreFeedback}
              </div>
            )}

            <div className="space-y-6">
              {/* Opção 1: Restaurar Histórico da Planilha Google */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <h4 className="font-black text-sm text-slate-900">Restaurar pelo Histórico do Google Sheets (Recomendado)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O Google Sheets salva automaticamente <strong>todas as versões anteriores</strong> da sua planilha. Se as informações originais foram sobrescritas:
                </p>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-5">
                  <li>Abra sua planilha do Google Drive vinculada a este app.</li>
                  <li>Clique no menu <strong>Arquivo &gt; Histórico de versões &gt; Ver histórico de versões</strong> (ou <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-mono">Ctrl + Alt + Shift + H</kbd>).</li>
                  <li>Selecione a versão anterior de hoje ou de ontem.</li>
                  <li>Clique no botão verde <strong>"Restaurar esta versão"</strong> no topo da planilha.</li>
                </ol>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      syncFromSheets(false);
                      setRestoreFeedback('Buscando e recarregando os dados da planilha Google...');
                      setTimeout(() => setRestoreFeedback(null), 3000);
                    }}
                    disabled={isSyncing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    Recarregar Dados da Planilha Agora
                  </button>
                </div>
              </div>

              {/* Opção 2: Backup Local em JSON */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center">2</span>
                  <h4 className="font-black text-sm text-slate-900">Backup e Restauração em Arquivo JSON</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Salve uma cópia de segurança em seu computador ou envie um arquivo de backup salvo anteriormente:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button 
                    onClick={handleExportBackup}
                    className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Baixar Backup JSON
                  </button>

                  <label className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload size={14} /> Importar Backup JSON
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportBackup} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Opção 3: Restaurar Todos os Dados Oficiais PIBJE */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <h4 className="font-black text-sm text-slate-900">Restaurar Informações Oficiais do Ministério PIBJE</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Restaura instantaneamente todos os integrantes da equipe (Matheus Peres, Lucas Silva, Ana Paula e ministros), repertório completo com tons e links, e as escalas de cultos.
                </p>
                <div className="pt-1">
                  <button 
                    onClick={handleResetToDefaultMinistryData}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    Restaurar Dados Completos do Ministério Agora
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowRestoreModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;

