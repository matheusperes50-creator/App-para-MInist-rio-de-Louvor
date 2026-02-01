
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Songs } from './components/Songs';
import { Schedules } from './components/Schedules';
import { Member, Song, Schedule, ViewType } from './types';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

// URL interna da planilha (Google Apps Script)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgTH_QOKSPlFXJROYxQWRk-53YM1dc5ZWs6Iyi-AZs8_HdJJdwseL14f5qcvqtQhLV/exec';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('louvor_members');
    return saved ? JSON.parse(saved) : [];
  });

  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('louvor_songs');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('louvor_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  const isInitialMount = useRef(true);

  // Persistência local como fallback
  useEffect(() => localStorage.setItem('louvor_members', JSON.stringify(members)), [members]);
  useEffect(() => localStorage.setItem('louvor_songs', JSON.stringify(songs)), [songs]);
  useEffect(() => localStorage.setItem('louvor_schedules', JSON.stringify(schedules)), [schedules]);

  const syncToSheets = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ members, songs, schedules })
      });
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [members, songs, schedules]);

  // Sincronização automática ao alterar dados
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      syncToSheets();
    }, 3000);
    return () => clearTimeout(timer);
  }, [members, songs, schedules, syncToSheets]);

  const syncFromSheets = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) throw new Error('Falha na resposta');
      const data = await response.json();
      if (data.members) setMembers(data.members);
      if (data.songs) setSongs(data.songs);
      if (data.schedules) setSchedules(data.schedules);
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'dashboard': 
        return <Dashboard members={members} songs={songs} schedules={schedules} onSync={syncFromSheets} isSyncing={isSyncing} />;
      case 'members': 
        return <Members members={members} setMembers={setMembers} />;
      case 'songs': 
        return <Songs songs={songs} setSongs={setSongs} />;
      case 'schedules': 
        return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} />;
      default: 
        return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-200 flex items-center gap-2">
            <Cloud size={14} /> Nuvem Conectada
          </div>
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-indigo-500 animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Sincronizando...</span>
            </div>
          )}
          {syncStatus === 'success' && <CheckCircle2 size={16} className="text-green-600" />}
          {syncStatus === 'error' && <AlertCircle size={16} className="text-red-600" />}
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
