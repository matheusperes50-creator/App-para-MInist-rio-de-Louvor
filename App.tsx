
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Songs } from './components/Songs';
import { Schedules } from './components/Schedules';
import { Member, Song, Schedule, ViewType } from './types';
import { Cloud, CloudOff, RefreshCw, Settings, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [scriptUrl, setScriptUrl] = useState<string>(() => localStorage.getItem('louvor_script_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
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

  // Ref para evitar loop infinito na sincronização automática
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
      // Usamos 'text/plain' para evitar problemas de CORS Preflight no Google Apps Script
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ members, songs, schedules })
      });
      
      setLastSync(new Date().toLocaleTimeString());
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [scriptUrl, members, songs, schedules]);

  // Sincronização Automática: Salva na nuvem sempre que os dados mudarem (após o mount inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (scriptUrl) syncToSheets();
    }, 2000); // Debounce de 2 segundos para não sobrecarregar a API
    return () => clearTimeout(timer);
  }, [members, songs, schedules, syncToSheets, scriptUrl]);

  const syncFromSheets = useCallback(async () => {
    if (!scriptUrl) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error('Falha na resposta do servidor');
      const data = await response.json();
      if (data.members) setMembers(data.members);
      if (data.songs) setSongs(data.songs);
      if (data.schedules) setSchedules(data.schedules);
      setLastSync(new Date().toLocaleTimeString());
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setSyncStatus('error');
      alert("Não foi possível baixar os dados. Verifique a URL e se a implantação no Google está como 'Qualquer Pessoa'.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [scriptUrl]);

  const renderContent = () => {
    if (showSettings) {
      return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Settings className="text-indigo-600" /> Configuração da Nuvem
          </h2>
          
          <div className="bg-indigo-50 p-5 rounded-2xl mb-6 border border-indigo-100 space-y-3">
            <h4 className="text-indigo-800 font-bold text-sm flex items-center gap-2">
              <Info size={16} /> Como conectar sua Planilha
            </h4>
            <ol className="text-xs text-indigo-700 space-y-2 list-decimal ml-4 font-medium">
              <li>Na sua Planilha Google, vá em <strong>Extensões > Apps Script</strong>.</li>
              <li>Cole o código do backend (fornecido anteriormente).</li>
              <li>Clique em <strong>Implantar > Nova Implantação</strong>.</li>
              <li>Tipo: <strong>App da Web</strong> | Acesso: <strong>Qualquer pessoa</strong>.</li>
              <li>Copie a URL gerada e cole no campo abaixo.</li>
            </ol>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">URL de Implantação do Google</label>
              <input 
                type="text" 
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Fechar
              </button>
              <button 
                onClick={() => { syncFromSheets(); setShowSettings(false); }}
                className="flex-1 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Testar Conexão
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard members={members} songs={songs} schedules={schedules} onSync={syncToSheets} isSyncing={isSyncing} />;
      case 'members':
        return <Members members={members} setMembers={setMembers} />;
      case 'songs':
        return <Songs songs={songs} setSongs={setSongs} />;
      case 'schedules':
        return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} />;
      default:
        return <Dashboard members={members} songs={songs} schedules={schedules} onSync={syncToSheets} isSyncing={isSyncing} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {scriptUrl ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase border border-green-100 tracking-tight">
              <Cloud size={12} /> Sincronização Ativa
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase border border-amber-100 tracking-tight">
              <CloudOff size={12} /> Modo Local
            </div>
          )}
          
          {isSyncing && (
            <div className="flex items-center gap-1 text-indigo-500 animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[10px] font-bold">Salvando...</span>
            </div>
          )}

          {syncStatus === 'success' && !isSyncing && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={12} />
              <span className="text-[10px] font-bold">Nuvem Atualizada</span>
            </div>
          )}
          
          {syncStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle size={12} />
              <span className="text-[10px] font-bold">Falha na Nuvem</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 transition-all rounded-lg border shadow-sm ${showSettings ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600'}`}
            title="Configurar Planilha"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
