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
import { Member, Song, Schedule, ViewType, UserRoleType, SongStatus, ExternalEvent, LookStyle as LookStyleType } from './types';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, LogOut, ShieldCheck } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeUYtQd3mDz6cBQxTrJm_jPcV-_ywtI7yxWOQNdfKKFprEXouHdlbUshccSy2DF34I/exec';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  
  // Alterado para sempre iniciar como 'guest', forçando a tela de login no reinício
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
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_songs');
      const parsed = saved ? JSON.parse(saved) : null;
      const validSongs = Array.isArray(parsed) ? parsed : [];
      // Garantir que todas as músicas tenham status
      return validSongs.map(s => ({ ...s, status: s.status || SongStatus.READY }));
    } catch { return []; }
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_schedules');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [events, setEvents] = useState<ExternalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_events');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [styles, setStyles] = useState<LookStyleType[]>(() => {
    try {
      const saved = localStorage.getItem('louvor_styles');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [announcements, setAnnouncements] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('louvor_announcements');
      return saved || '';
    } catch { return ''; }
  });

  const isInitialMount = useRef(true);

  const handleLogin = (role: UserRoleType) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole('guest');
  };

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
        setMembers(Array.isArray(data.members) ? data.members : []);
        
        const cloudSongs = Array.isArray(data.songs) ? data.songs : [];
        setSongs(cloudSongs.map((s: any) => ({
          ...s,
          status: s.status || SongStatus.READY
        })));
        
        setSchedules(Array.isArray(data.schedules) ? data.schedules : []);
        setEvents(Array.isArray(data.events) ? data.events : []);
        setStyles(Array.isArray(data.styles) ? data.styles : []);
        
        setAnnouncements(prev => {
          if (data.announcements) return data.announcements;
          if (hasFetchedRef.current) return '';
          return prev || '';
        });
        
        hasFetchedRef.current = true;
        setHasFetchedFromCloud(true);
        if (!isAuto) setSyncStatus('success');
      }
    } catch (error) {
      console.error("Erro ao sincronizar da nuvem:", error);
      if (!isAuto) setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      if (!isAuto) setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  useEffect(() => {
    if (userRole !== 'guest') {
      syncFromSheets(true);
    }
  }, [syncFromSheets, userRole]);

  useEffect(() => {
    localStorage.setItem('louvor_members', JSON.stringify(members));
    localStorage.setItem('louvor_songs', JSON.stringify(songs));
    localStorage.setItem('louvor_schedules', JSON.stringify(schedules));
    localStorage.setItem('louvor_events', JSON.stringify(events));
    localStorage.setItem('louvor_styles', JSON.stringify(styles));
    localStorage.setItem('louvor_announcements', announcements);
  }, [members, songs, schedules, events, styles, announcements]);

  const syncToSheets = useCallback(async () => {
    if (!hasFetchedFromCloud || initialLoading || userRole !== 'admin') return;

    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const payload = { 
        members: members || [], 
        songs: songs || [], 
        schedules: schedules || [],
        events: events || [],
        styles: styles || [],
        announcements: announcements || ''
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao salvar na nuvem:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [members, songs, schedules, hasFetchedFromCloud, initialLoading, userRole]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (userRole === 'admin') {
      const timer = setTimeout(() => syncToSheets(), 2000);
      return () => clearTimeout(timer);
    }
  }, [members, songs, schedules, events, styles, announcements, syncToSheets, userRole]);

  const handleUpdateAnnouncements = useCallback((val: string) => {
    setAnnouncements(val);
    // Força uma sincronização mais rápida para avisos
    if (userRole === 'admin') {
      setTimeout(() => syncToSheets(), 1000);
    }
  }, [userRole, syncToSheets]);

  if (userRole === 'guest') {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const isAdmin = userRole === 'admin';
    const syncProps = { onSync: () => syncFromSheets(false), isSyncing, isAdmin };
    
    switch (view) {
      case 'dashboard': return <Dashboard members={members} songs={songs} schedules={schedules} announcements={announcements} setAnnouncements={handleUpdateAnnouncements} {...syncProps} />;
      case 'members': return <Members members={members} setMembers={setMembers} {...syncProps} />;
      case 'songs': return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="repertoire" {...syncProps} />;
      case 'new-songs': return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="new" {...syncProps} />;
      case 'schedules': return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} setSongs={setSongs} {...syncProps} />;
      case 'reports': return <Reports schedules={schedules} members={members} songs={songs} events={events} />;
      case 'events': return <Events events={events} setEvents={setEvents} members={members} songs={songs} isAdmin={isAdmin} />;
      case 'style': return <LookStyle styles={styles} setStyles={setStyles} {...syncProps} />;
      default: return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userRole={userRole}>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${hasFetchedFromCloud ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Cloud size={12} /> {hasFetchedFromCloud ? 'Sincronizado' : 'Offline'}
          </div>
          {isSyncing && <RefreshCw size={12} className="text-emerald-600 animate-spin" />}
          {syncStatus === 'success' && <CheckCircle2 size={14} className="text-emerald-600" />}
          {syncStatus === 'error' && <AlertCircle size={14} className="text-red-600" />}
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          Sair <LogOut size={12} />
        </button>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;