import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Songs } from './components/Songs';
import { Schedules } from './components/Schedules';
import { Member, Song, Schedule, ViewType } from './types';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgTH_QOKSPlFXJROYxQWRk-53YM1dc5ZWs6Iyi-AZs8_HdJJdwseL14f5qcvqtQhLV/exec';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasFetchedFromCloud, setHasFetchedFromCloud] = useState(false);
  
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('louvor_members');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('louvor_songs');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('louvor_schedules');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const isInitialMount = useRef(true);

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
        if (Array.isArray(data.members)) setMembers(data.members);
        if (Array.isArray(data.songs)) setSongs(data.songs);
        if (Array.isArray(data.schedules)) setSchedules(data.schedules);
        
        setHasFetchedFromCloud(true);
        if (!isAuto) setSyncStatus('success');
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      if (!isAuto) setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      if (!isAuto) setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  useEffect(() => {
    syncFromSheets(true);
  }, [syncFromSheets]);

  useEffect(() => {
    localStorage.setItem('louvor_members', JSON.stringify(members));
    localStorage.setItem('louvor_songs', JSON.stringify(songs));
    localStorage.setItem('louvor_schedules', JSON.stringify(schedules));
  }, [members, songs, schedules]);

  const syncToSheets = useCallback(async () => {
    if (!hasFetchedFromCloud || initialLoading) return;

    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const payload = { members, songs, schedules };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [members, songs, schedules, hasFetchedFromCloud, initialLoading]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => syncToSheets(), 5000);
    return () => clearTimeout(timer);
  }, [members, songs, schedules, syncToSheets]);

  const renderContent = () => {
    const syncProps = { onSync: () => syncFromSheets(false), isSyncing };
    
    switch (view) {
      case 'dashboard': return <Dashboard members={members} songs={songs} schedules={schedules} {...syncProps} />;
      case 'members': return <Members members={members} setMembers={setMembers} {...syncProps} />;
      case 'songs': return <Songs songs={songs} setSongs={setSongs} {...syncProps} />;
      case 'schedules': return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} setSongs={setSongs} {...syncProps} />;
      default: return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${hasFetchedFromCloud ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Cloud size={14} /> {hasFetchedFromCloud ? 'Planilha Conectada' : 'Sincronizando...'}
          </div>
          {isSyncing && <RefreshCw size={14} className="text-emerald-600 animate-spin" />}
          {syncStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-600 animate-in zoom-in" />}
          {syncStatus === 'error' && <AlertCircle size={16} className="text-red-600 animate-in bounce" />}
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;