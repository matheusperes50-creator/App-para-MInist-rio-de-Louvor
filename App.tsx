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
import { Settings } from './components/Settings';
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

// Purge any outdated mock test cache if it contains old dummy names from previous testing
const checkAndPurgeOldMockCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('louvor_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((m: any) => m.name === 'Matheus Peres' || m.name === 'Lucas Silva' || m.name === 'Ana Paula Rocha')) {
        localStorage.removeItem('louvor_members');
        localStorage.removeItem('louvor_songs');
        localStorage.removeItem('louvor_schedules');
        localStorage.removeItem('louvor_events');
        localStorage.removeItem('louvor_styles');
        localStorage.removeItem('louvor_notes');
        localStorage.removeItem('louvor_announcements');
        localStorage.removeItem('louvor_attendance');
      }
    }
  } catch {}
};
checkAndPurgeOldMockCache();

export const App: React.FC = () => {
  const isDirectAttendance = checkIsAttendanceDirectLink();
  const [view, setView] = useState<ViewType>(() => isDirectAttendance ? 'attendance' : 'dashboard');
  const [userRole, setUserRole] = useState<UserRoleType>(() => isDirectAttendance ? 'member' : 'guest');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasFetchedFromCloud, setHasFetchedFromCloud] = useState(false);
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

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setSyncStatus('success');
      setHasFetchedFromCloud(true);
    } catch (error) {
      console.error('Erro ao salvar na nuvem:', error);
      // Retry once after 1s
      try {
        await new Promise(r => setTimeout(r, 1000));
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        setSyncStatus('success');
        setHasFetchedFromCloud(true);
      } catch (retryError) {
        console.error('Falha na segunda tentativa de salvar na nuvem:', retryError);
        setSyncStatus('error');
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [userRole]);

  // Dedicated update handlers that synchronously update state, refs, localStorage, and immediately persist to Google Sheets
  const handleSetMembers = useCallback((action: React.SetStateAction<Member[]>) => {
    setMembers(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      membersRef.current = updated;
      try { localStorage.setItem('louvor_members', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ members: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetSongs = useCallback((action: React.SetStateAction<Song[]>) => {
    setSongs(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      songsRef.current = updated;
      try { localStorage.setItem('louvor_songs', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ songs: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetSchedules = useCallback((action: React.SetStateAction<Schedule[]>) => {
    setSchedules(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      schedulesRef.current = updated;
      try { localStorage.setItem('louvor_schedules', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ schedules: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetEvents = useCallback((action: React.SetStateAction<ExternalEvent[]>) => {
    setEvents(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      eventsRef.current = updated;
      try { localStorage.setItem('louvor_events', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ events: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetStyles = useCallback((action: React.SetStateAction<LookStyleType[]>) => {
    setStyles(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      stylesRef.current = updated;
      try { localStorage.setItem('louvor_styles', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ styles: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetNotes = useCallback((action: React.SetStateAction<RehearsalNote[]>) => {
    setNotes(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      notesRef.current = updated;
      try { localStorage.setItem('louvor_notes', JSON.stringify(updated)); } catch (e) {}
      if (userRole === 'admin') {
        saveToCloudNow({ notes: updated });
      }
      return updated;
    });
  }, [userRole, saveToCloudNow]);

  const handleSetAttendanceEvents = useCallback((action: React.SetStateAction<AttendanceEvent[]>) => {
    setAttendanceEvents(prev => {
      const updated = typeof action === 'function' ? action(prev) : action;
      attendanceEventsRef.current = updated;
      try { localStorage.setItem('louvor_attendance', JSON.stringify(updated)); } catch (e) {}
      saveToCloudNow({ attendanceEvents: updated });
      return updated;
    });
  }, [saveToCloudNow]);

  // SYNC FROM SHEETS:
  // Reads authoritative cloud data and updates state and localStorage directly so all devices match.
  const syncFromSheets = useCallback(async (isAuto = false, forceReplace = false) => {
    if (!isAuto) setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const fetchUrl = `${SCRIPT_URL}?_t=${Date.now()}`;
      const response = await fetch(fetchUrl);

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
        // Members: authoritative array from Google Sheets
        if (Array.isArray(data.members)) {
          setMembers(data.members);
          membersRef.current = data.members;
          try {
            localStorage.setItem('louvor_members', JSON.stringify(data.members));
          } catch (e) {}
        }

        // Songs: authoritative array from Google Sheets
        if (Array.isArray(data.songs)) {
          const validSongs = data.songs.map((s: any) => ({
            ...s,
            status: s.status || SongStatus.READY
          }));
          setSongs(validSongs);
          songsRef.current = validSongs;
          try {
            localStorage.setItem('louvor_songs', JSON.stringify(validSongs));
          } catch (e) {}
        }

        // Schedules: authoritative list from Google Sheets (normalize song IDs if needed)
        if (Array.isArray(data.schedules)) {
          const normalized = data.schedules.map((sch: any) => {
            const leaderIds = Array.isArray(sch.leaderIds) 
              ? sch.leaderIds 
              : (sch.leaderId ? [sch.leaderId] : []);
              
            const songs = (sch.songs || []).map((songItem: any) => {
              if (typeof songItem === 'string') {
                return { id: songItem, key: '', confirmed: true };
              }
              return {
                id: songItem?.id || '',
                key: songItem?.key || '',
                confirmed: songItem?.confirmed ?? false
              };
            });

            return {
              ...sch,
              serviceType: sch.serviceType || 'Domingo (Noite)',
              leaderIds,
              songs,
              vocalIds: sch.vocalIds || [],
              assignments: sch.assignments || []
            };
          });

          setSchedules(normalized);
          schedulesRef.current = normalized;
          try {
            localStorage.setItem('louvor_schedules', JSON.stringify(normalized));
          } catch (e) {}
        }

        // Attendance: authoritative attendance events from Google Sheets
        const cloudAttendance = Array.isArray(data.attendanceEvents) ? data.attendanceEvents : (Array.isArray(data.attendance) ? data.attendance : null);
        if (Array.isArray(cloudAttendance)) {
          setAttendanceEvents(cloudAttendance);
          attendanceEventsRef.current = cloudAttendance;
          try {
            localStorage.setItem('louvor_attendance', JSON.stringify(cloudAttendance));
          } catch (e) {}
        }

        // Events: authoritative array from Google Sheets
        if (Array.isArray(data.events)) {
          setEvents(data.events);
          eventsRef.current = data.events;
          try {
            localStorage.setItem('louvor_events', JSON.stringify(data.events));
          } catch (e) {}
        }

        // Notes: authoritative array from Google Sheets
        if (Array.isArray(data.notes)) {
          setNotes(data.notes);
          notesRef.current = data.notes;
          try {
            localStorage.setItem('louvor_notes', JSON.stringify(data.notes));
          } catch (e) {}
        }

        // Styles: authoritative array from Google Sheets
        if (Array.isArray(data.styles)) {
          setStyles(data.styles);
          stylesRef.current = data.styles;
          try {
            localStorage.setItem('louvor_styles', JSON.stringify(data.styles));
          } catch (e) {}
        }

        // Announcements: authoritative announcements string from Google Sheets
        if (typeof data.announcements === 'string') {
          setAnnouncements(data.announcements);
          announcementsRef.current = data.announcements;
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

  // Settings sync bridge
  const handleSettingsSync = useCallback(async (force = false) => {
    await syncFromSheets(false, force);
  }, [syncFromSheets]);

  // Login handler that sets role and immediately triggers a cloud sync to load fresh data
  const handleLogin = useCallback((role: UserRoleType) => {
    setUserRole(role);
    syncFromSheets(true);
  }, [syncFromSheets]);

  // Initial cloud fetch from Google Sheets database immediately on initial mount
  useEffect(() => {
    syncFromSheets(true);
  }, [syncFromSheets]);

  // Periodic background sync (every 45s when document is visible) so all devices reflect real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isSyncing) {
        syncFromSheets(true);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [isSyncing, syncFromSheets]);

  const handleUpdateAnnouncements = useCallback((val: string) => {
    setAnnouncements(val);
    announcementsRef.current = val;
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
            setAttendanceEvents={handleSetAttendanceEvents} 
            members={members} 
            schedules={schedules} 
            setSchedules={handleSetSchedules} 
            setView={setView} 
            {...syncProps} 
          />
        );
      case 'members': 
        return <Members members={members} setMembers={handleSetMembers} {...syncProps} />;
      case 'songs': 
        return <Songs songs={songs} setSongs={handleSetSongs} schedules={schedules} filterMode="repertoire" {...syncProps} />;
      case 'new-songs': 
        return <Songs songs={songs} setSongs={handleSetSongs} schedules={schedules} filterMode="new" {...syncProps} />;
      case 'schedules': 
        return <Schedules schedules={schedules} setSchedules={handleSetSchedules} members={members} songs={songs} setSongs={handleSetSongs} {...syncProps} />;
      case 'reports': 
        return <Reports schedules={schedules} members={members} songs={songs} events={events} />;
      case 'events': 
        return <Events events={events} setEvents={handleSetEvents} members={members} songs={songs} isAdmin={isAdmin} />;
      case 'style': 
        return <LookStyle styles={styles} setStyles={handleSetStyles} {...syncProps} />;
      case 'auto-schedules': 
        return <AutoSchedules schedules={schedules} setSchedules={handleSetSchedules} members={members} setView={setView} attendanceEvents={attendanceEvents} {...syncProps} />;
      case 'notes': 
        return <Notes notes={notes} setNotes={handleSetNotes} songs={songs} {...syncProps} />;
      case 'settings':
        return (
          <Settings 
            onSync={handleSettingsSync}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            hasFetchedFromCloud={hasFetchedFromCloud}
            members={members}
            songs={songs}
            schedules={schedules}
            attendanceEvents={attendanceEvents}
            isAdmin={isAdmin}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onRestoreDefaults={handleResetToDefaultMinistryData}
            restoreFeedback={restoreFeedback}
          />
        );
      default: 
        return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userRole={userRole}>
      {/* Barra superior limpa: apenas o status da planilha conectada e o botão de sair */}
      <div className="flex justify-between items-center gap-3 mb-4 md:mb-6">
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
        
        <div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            Sair <LogOut size={12} />
          </button>
        </div>
      </div>

      {renderContent()}
    </Layout>
  );
};

export default App;

