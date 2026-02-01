
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Members } from './components/Members.tsx';
import { Songs } from './components/Songs.tsx';
import { Schedules } from './components/Schedules.tsx';
import { Member, Song, Schedule, ViewType } from './types.ts';
import { Cloud, CloudOff, RefreshCw, Settings, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  
  // Verificação resiliente para evitar erro Uncaught TypeError
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    try {
      // @ts-ignore
      const env = typeof import.meta !== 'undefined' && (import.meta as any).env 
        ? (import.meta as any).env 
        : {};
      return env.VITE_SCRIPT_URL || localStorage.getItem('louvor_script_url') || '';
    } catch (e) {
      return localStorage.getItem('louvor_script_url') || '';
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  
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

  useEffect(() => {
    localStorage.setItem('louvor_script_url', scriptUrl);
  }, [scriptUrl]);

  useEffect(() => localStorage.setItem('louvor_members', JSON.stringify(members)), [members]);
  useEffect(() => localStorage.setItem('louvor_songs', JSON.stringify(songs)), [songs]);
  useEffect(() => localStorage.setItem('louvor_schedules', JSON.stringify(schedules)), [schedules]);

  const syncToSheets = useCallback(async () => {
    if (!scriptUrl) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await fetch(scriptUrl, {
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
  }, [scriptUrl, members, songs, schedules]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (scriptUrl) syncToSheets();
    }, 2000);
    return () => clearTimeout(timer);
  }, [members, songs, schedules, syncToSheets, scriptUrl]);

  const syncFromSheets = useCallback(async () => {
    if (!scriptUrl) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error('Falha');
      const data = await response.json();
      if (data.members) setMembers(data.members);
      if (data.songs) setSongs(data.songs);
      if (data.schedules) setSchedules(data.schedules);
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [scriptUrl]);

  const renderContent = () => {
    if (showSettings) {
      return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-6">
            <Settings className="text-indigo-600" size={32} /> Nuvem
          </h2>
          <div className="space-y-6">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <h4 className="text-indigo-800 font-bold flex items-center gap-2 mb-2"><Info size={16} /> Configuração</h4>
              <p className="text-xs text-indigo-600 leading-relaxed">Insira a URL do seu Google Apps Script para sincronizar os dados em tempo real com sua planilha.</p>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">URL do Script</label>
              <input 
                type="text" 
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all">Fechar</button>
              <button onClick={() => { syncFromSheets(); setShowSettings(false); }} className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Testar Conexão</button>
            </div>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'dashboard': return <Dashboard members={members} songs={songs} schedules={schedules} onSync={syncToSheets} isSyncing={isSyncing} />;
      case 'members': return <Members members={members} setMembers={setMembers} />;
      case 'songs': return <Songs songs={songs} setSongs={setSongs} />;
      case 'schedules': return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} />;
      default: return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${scriptUrl ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {scriptUrl ? 'Nuvem Ativa' : 'Offline'}
          </div>
          {isSyncing && <RefreshCw size={14} className="text-indigo-500 animate-spin" />}
          {syncStatus === 'success' && <CheckCircle2 size={14} className="text-green-600" />}
          {syncStatus === 'error' && <AlertCircle size={14} className="text-red-600" />}
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-2xl border transition-all ${showSettings ? 'bg-indigo-600 text-white shadow-xl rotate-90' : 'bg-white text-slate-400 hover:text-indigo-600'}`}>
          <Settings size={22} />
        </button>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
