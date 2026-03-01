import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Songs } from './components/Songs';
import { Schedules } from './components/Schedules';
import { AccessLogs } from './components/AccessLogs';
import { Login } from './components/Login';
import { Member, Song, Schedule, ViewType, UserRoleType, SongStatus, AccessLog } from './types';
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

  const [announcements, setAnnouncements] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('louvor_announcements');
      return saved || '';
    } catch { return ''; }
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

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
        
        setAnnouncements(prev => {
          // Se a nuvem tem dados, usa os dados da nuvem
          if (data.announcements) return data.announcements;
          // Se não tem dados na nuvem mas já tínhamos sincronizado antes, 
          // significa que os avisos foram apagados na nuvem
          if (hasFetchedRef.current) return '';
          // Se é a primeira sincronização e a nuvem está vazia, mantém o que está no localStorage
          return prev || '';
        });

        setAccessLogs(Array.isArray(data.accessLogs) ? data.accessLogs : []);
        
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
    localStorage.setItem('louvor_announcements', announcements);
  }, [members, songs, schedules, announcements]);

  const syncToSheets = useCallback(async () => {
    if (!hasFetchedFromCloud || initialLoading || userRole !== 'admin') return;

    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const payload = { 
        members: members || [], 
        songs: songs || [], 
        schedules: schedules || [],
        announcements: announcements || '',
        accessLogs: accessLogs || []
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
  }, [members, songs, schedules, announcements, accessLogs, syncToSheets, userRole]);

  const logAccess = useCallback(async (role: UserRoleType) => {
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';
    
    const newLog: AccessLog = {
      id: Math.random().toString(36).substring(2, 10).toUpperCase(),
      userEmail: 'matheusperes50@gmail.com', // Using the provided context email
      role,
      device,
      timestamp: new Date().toISOString()
    };

    setAccessLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  useEffect(() => {
    if (userRole !== 'guest' && hasFetchedFromCloud) {
      logAccess(userRole);
    }
  }, [userRole, hasFetchedFromCloud, logAccess]);

  if (userRole === 'guest') {
    return <Login onLogin={handleLogin} />;
  }

  const handleUpdateAnnouncements = useCallback((val: string) => {
    setAnnouncements(val);
    // Força uma sincronização mais rápida para avisos
    if (userRole === 'admin') {
      setTimeout(() => syncToSheets(), 1000);
    }
  }, [userRole, syncToSheets]);

  const renderContent = () => {
    const isAdmin = userRole === 'admin';
    const syncProps = { onSync: () => syncFromSheets(false), isSyncing, isAdmin };
    
    switch (view) {
      case 'dashboard': return <Dashboard members={members} songs={songs} schedules={schedules} announcements={announcements} setAnnouncements={handleUpdateAnnouncements} {...syncProps} />;
      case 'members': return <Members members={members} setMembers={setMembers} {...syncProps} />;
      case 'songs': return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="repertoire" {...syncProps} />;
      case 'new-songs': return <Songs songs={songs} setSongs={setSongs} schedules={schedules} filterMode="new" {...syncProps} />;
      case 'schedules': return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} setSongs={setSongs} {...syncProps} />;
      case 'logs': return <AccessLogs logs={accessLogs} {...syncProps} />;
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