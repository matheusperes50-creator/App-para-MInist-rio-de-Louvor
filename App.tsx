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
import { Member, Song, Schedule, ViewType, UserRoleType, SongStatus, ExternalEvent, LookStyle as LookStyleType, RehearsalNote } from './types';
import { DEFAULT_MEMBERS, DEFAULT_SONGS, DEFAULT_SCHEDULES, DEFAULT_EVENTS, DEFAULT_NOTES } from './initialData';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeUYtQd3mDz6cBQxTrJm_jPcV-_ywtI7yxWOQNdfKKFprEXouHdlbUshccSy2DF34I/exec';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [userRole, setUserRole] = useState<UserRoleType>('guest');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasFetchedFromCloud, setHasFetchedFromCloud] = useState(false);
  const hasFetchedRef = useRef(false);
  
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_members');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MEMBERS;
    } catch { return DEFAULT_MEMBERS; }
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_songs');
      const parsed = saved ? JSON.parse(saved) : null;
      const validSongs = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SONGS;
      return validSongs.map(s => ({ ...s, status: s.status || SongStatus.READY }));
    } catch { return DEFAULT_SONGS; }
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_schedules');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SCHEDULES;
    } catch { return DEFAULT_SCHEDULES; }
  });

  const [events, setEvents] = useState<ExternalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_events');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EVENTS;
    } catch { return DEFAULT_EVENTS; }
  });

  const [styles, setStyles] = useState<LookStyleType[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_styles');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [notes, setNotes] = useState<RehearsalNote[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_notes');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_NOTES;
    } catch { return DEFAULT_NOTES; }
  });

  const [announcements, setAnnouncements] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('louvor_announcements');
      return saved || '';
    } catch { return ''; }
  });

  // Keep live references to state to prevent stale closures during async sync
  const membersRef = useRef(members);
  const songsRef = useRef(songs);
  const schedulesRef = useRef(schedules);
  const eventsRef = useRef(events);
  const stylesRef = useRef(styles);
  const notesRef = useRef(notes);
  const announcementsRef = useRef(announcements);

  useEffect(() => { membersRef.current = members; }, [members]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { schedulesRef.current = schedules; }, [schedules]);
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { stylesRef.current = styles; }, [styles]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { announcementsRef.current = announcements; }, [announcements]);

  const isInitialMount = useRef(true);

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
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }
  }, [members, songs, schedules, events, styles, notes, announcements]);

  const handleLogin = (role: UserRoleType) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole('guest');
  };

  // Immediate cloud save function
  const saveToCloudNow = useCallback(async (overridePayload?: {
    members?: Member[];
    songs?: Song[];
    schedules?: Schedule[];
    events?: ExternalEvent[];
    styles?: LookStyleType[];
    notes?: RehearsalNote[];
    announcements?: string;
  }) => {
    if (userRole !== 'admin') return;

    setIsSyncing(true);
    setSyncStatus('idle');

    const targetMembers = overridePayload?.members ?? membersRef.current ?? [];
    const targetSongs = overridePayload?.songs ?? songsRef.current ?? [];
    const targetSchedules = overridePayload?.schedules ?? schedulesRef.current ?? [];
    const targetEvents = overridePayload?.events ?? eventsRef.current ?? [];
    const targetStyles = overridePayload?.styles ?? stylesRef.current ?? [];
    const targetNotes = overridePayload?.notes ?? notesRef.current ?? [];
    const targetAnnouncements = overridePayload?.announcements ?? announcementsRef.current ?? '';

    try {
      const payload = {
        members: targetMembers,
        songs: targetSongs,
        schedules: targetSchedules,
        events: targetEvents,
        styles: targetStyles,
        notes: targetNotes,
        announcements: targetAnnouncements
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

  // SMART NON-DESTRUCTIVE SYNC FROM SHEETS:
  // Merges cloud data with local data so newly created scales or edits are NEVER wiped out!
  const syncFromSheets = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Falha na conexão');

      const text = await response.text();
      const data = JSON.parse(text);

      if (data && typeof data === 'object') {
        let hasLocalExtraSchedules = false;

        // 1. SMART MERGE SCHEDULES
        const cloudSchedules: Schedule[] = Array.isArray(data.schedules) ? data.schedules : [];
        let finalMergedSchedules: Schedule[] = [];

        setSchedules(prev => {
          const scheduleMap = new Map<string, Schedule>();

          // First populate with cloud schedules
          cloudSchedules.forEach(s => {
            if (s && s.id) {
              scheduleMap.set(s.id, s);
            }
          });

          // Then merge local schedules (preserve any newly created schedules!)
          (prev || []).forEach(local => {
            if (!local || !local.id) return;
            const cloudExisting = scheduleMap.get(local.id);
            if (!cloudExisting) {
              // Local schedule is not present in cloud yet: ALWAYS PRESERVE IT!
              scheduleMap.set(local.id, local);
              hasLocalExtraSchedules = true;
            } else {
              // Present in both: preserve local details if local has songs, assignments, observations or attendance
              const hasLocalDetails = (local.songs && local.songs.length > 0) ||
                (local.assignments && local.assignments.length > 0) ||
                (local.leaderIds && local.leaderIds.length > 0) ||
                local.attendanceMarked ||
                local.observations;

              if (hasLocalDetails) {
                scheduleMap.set(local.id, { ...cloudExisting, ...local });
              }
            }
          });

          finalMergedSchedules = Array.from(scheduleMap.values()).sort((a, b) => 
            (b.date || '').localeCompare(a.date || '')
          );
          localStorage.setItem('louvor_schedules', JSON.stringify(finalMergedSchedules));
          return finalMergedSchedules;
        });

        // 2. SMART MERGE MEMBERS
        const cloudMembers: Member[] = Array.isArray(data.members) ? data.members : [];
        let finalMergedMembers: Member[] = [];
        setMembers(prev => {
          const memberMap = new Map<string, Member>();
          cloudMembers.forEach(m => { if (m && m.id) memberMap.set(m.id, m); });
          (prev || []).forEach(local => {
            if (!local || !local.id) return;
            if (!memberMap.has(local.id)) {
              memberMap.set(local.id, local);
              hasLocalExtraSchedules = true;
            } else {
              memberMap.set(local.id, { ...memberMap.get(local.id)!, ...local });
            }
          });
          finalMergedMembers = Array.from(memberMap.values());
          localStorage.setItem('louvor_members', JSON.stringify(finalMergedMembers));
          return finalMergedMembers;
        });

        // 3. SMART MERGE SONGS
        const cloudSongs: Song[] = Array.isArray(data.songs) ? data.songs : [];
        let finalMergedSongs: Song[] = [];
        setSongs(prev => {
          const songMap = new Map<string, Song>();
          cloudSongs.forEach(s => {
            if (s && s.id) {
              songMap.set(s.id, { ...s, status: s.status || SongStatus.READY });
            }
          });
          (prev || []).forEach(local => {
            if (!local || !local.id) return;
            if (!songMap.has(local.id)) {
              songMap.set(local.id, { ...local, status: local.status || SongStatus.READY });
              hasLocalExtraSchedules = true;
            } else {
              songMap.set(local.id, { ...songMap.get(local.id)!, ...local });
            }
          });
          finalMergedSongs = Array.from(songMap.values());
          localStorage.setItem('louvor_songs', JSON.stringify(finalMergedSongs));
          return finalMergedSongs;
        });

        // 4. SMART MERGE EVENTS
        const cloudEvents: ExternalEvent[] = Array.isArray(data.events) ? data.events : [];
        setEvents(prev => {
          const eventMap = new Map<string, ExternalEvent>();
          cloudEvents.forEach(e => { if (e && e.id) eventMap.set(e.id, e); });
          (prev || []).forEach(local => {
            if (!local || !local.id) return;
            if (!eventMap.has(local.id)) {
              eventMap.set(local.id, local);
            }
          });
          const merged = Array.from(eventMap.values());
          localStorage.setItem('louvor_events', JSON.stringify(merged));
          return merged;
        });

        // 5. SMART MERGE NOTES
        const cloudNotes: RehearsalNote[] = Array.isArray(data.notes) ? data.notes : [];
        setNotes(prev => {
          const noteMap = new Map<string, RehearsalNote>();
          cloudNotes.forEach(n => { if (n && n.id) noteMap.set(n.id, n); });
          (prev || []).forEach(local => {
            if (!local || !local.id) return;
            if (!noteMap.has(local.id)) {
              noteMap.set(local.id, local);
            }
          });
          const merged = Array.from(noteMap.values());
          localStorage.setItem('louvor_notes', JSON.stringify(merged));
          return merged;
        });

        // 6. STYLES & ANNOUNCEMENTS
        if (Array.isArray(data.styles) && data.styles.length > 0) {
          setStyles(data.styles);
          localStorage.setItem('louvor_styles', JSON.stringify(data.styles));
        }

        if (data.announcements !== undefined) {
          setAnnouncements(data.announcements);
          localStorage.setItem('louvor_announcements', data.announcements);
        }

        hasFetchedRef.current = true;
        setHasFetchedFromCloud(true);
        if (!isAuto) setSyncStatus('success');

        // If local had unsynced schedules/members/songs, push them back up to the cloud!
        if (hasLocalExtraSchedules && userRole === 'admin') {
          setTimeout(() => {
            saveToCloudNow({
              schedules: finalMergedSchedules,
              members: finalMergedMembers,
              songs: finalMergedSongs
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar da nuvem:', error);
      if (!isAuto) setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      if (!isAuto) setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [userRole, saveToCloudNow]);

  // Full two-way manual sync
  const handleManualSync = useCallback(async () => {
    await syncFromSheets(false);
    if (userRole === 'admin') {
      await saveToCloudNow();
    }
  }, [syncFromSheets, userRole, saveToCloudNow]);

  // Initial cloud fetch upon login
  useEffect(() => {
    if (userRole !== 'guest') {
      syncFromSheets(true);
    }
  }, [syncFromSheets, userRole]);

  // Auto-sync debounced timer when admin makes changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (userRole === 'admin') {
      const timer = setTimeout(() => {
        saveToCloudNow();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [members, songs, schedules, events, styles, notes, announcements, userRole, saveToCloudNow]);

  const handleUpdateAnnouncements = useCallback((val: string) => {
    setAnnouncements(val);
    try {
      localStorage.setItem('louvor_announcements', val);
    } catch (e) {}
    if (userRole === 'admin') {
      setTimeout(() => saveToCloudNow({ announcements: val }), 800);
    }
  }, [userRole, saveToCloudNow]);

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
        return <AutoSchedules schedules={schedules} setSchedules={setSchedules} members={members} setView={setView} {...syncProps} />;
      case 'notes': 
        return <Notes notes={notes} setNotes={setNotes} songs={songs} {...syncProps} />;
      default: 
        return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userRole={userRole}>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${hasFetchedFromCloud ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Cloud size={12} /> {hasFetchedFromCloud ? 'Sincronizado' : 'Offline / Local'}
          </div>
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <RefreshCw size={12} className="animate-spin" /> Salvando na nuvem...
            </div>
          )}
          {syncStatus === 'success' && !isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 size={12} /> Sincronizado com sucesso
            </div>
          )}
          {syncStatus === 'error' && !isSyncing && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              <AlertCircle size={12} /> Erro ao sincronizar nuvem
            </div>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
        >
          Sair <LogOut size={12} />
        </button>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
