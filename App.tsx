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
  const skipNextSync = useRef(false);

  // Sincroniza dados da planilha para o App (Prioridade Máxima)
  const syncFromSheets = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const response = await fetch(SCRIPT_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Servidor da planilha não respondeu corretamente.');
      
      const data = await response.json();
      
      // Validação rigorosa dos dados recebidos
      if (data && typeof data === 'object') {
        // Se a planilha tem membros, atualizamos. Se retornar vazio, mas for um objeto válido, 
        // assumimos que a planilha está realmente vazia.
        const cloudMembers = Array.isArray(data.members) ? data.members : [];
        const cloudSongs = Array.isArray(data.songs) ? data.songs : [];
        const cloudSchedules = Array.isArray(data.schedules) ? data.schedules : [];

        // Só atualiza o estado se houver algo ou se for a primeira carga
        // para evitar "piscadas" de dados sumindo
        setMembers(cloudMembers);
        setSongs(cloudSongs);
        setSchedules(cloudSchedules);
        
        setHasFetchedFromCloud(true);
        if (!isAuto) setSyncStatus('success');
      }
    } catch (error) {
      console.error("Erro crítico na sincronização de entrada:", error);
      if (!isAuto) {
        setSyncStatus('error');
        alert("Não foi possível carregar os dados da planilha. Verifique sua internet ou o link do Script.");
      }
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      if (!isAuto) setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  // Carregamento inicial obrigatório da Nuvem
  useEffect(() => {
    syncFromSheets(true);
  }, [syncFromSheets]);

  // Salva no LocalStorage sempre que houver mudança local (Backup de segurança)
  useEffect(() => {
    localStorage.setItem('louvor_members', JSON.stringify(members));
    localStorage.setItem('louvor_songs', JSON.stringify(songs));
    localStorage.setItem('louvor_schedules', JSON.stringify(schedules));
  }, [members, songs, schedules]);

  // Sincroniza dados do App para a planilha (Auto-save inteligente)
  const syncToSheets = useCallback(async () => {
    // REGRA DE OURO: Nunca salve na nuvem se você ainda não conseguiu ler da nuvem!
    // Isso evita que um app offline ou com erro de carga apague a planilha.
    if (!hasFetchedFromCloud || initialLoading) {
      console.warn("Sincronização de saída bloqueada: Dados da nuvem ainda não validados.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const payload = { 
        members, 
        songs, 
        schedules,
        lastUpdate: new Date().toISOString(),
        source: 'WebApp_V3'
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      setSyncStatus('success');
    } catch (error) {
      console.error("Erro ao salvar na planilha:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [members, songs, schedules, hasFetchedFromCloud, initialLoading]);

  // Debounce para evitar excesso de requisições ao digitar
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const timer = setTimeout(() => {
      syncToSheets();
    }, 4000); 

    return () => clearTimeout(timer);
  }, [members, songs, schedules, syncToSheets]);

  const renderContent = () => {
    if (initialLoading && members.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-700">
          <Loader2 size={48} className="text-emerald-500 animate-spin" />
          <div className="text-center">
            <h3 className="font-black text-slate-800 text-xl">Sincronizando com a nuvem...</h3>
            <p className="text-slate-400 font-medium">Buscando as informações mais recentes da sua planilha.</p>
          </div>
        </div>
      );
    }

    const syncProps = { onSync: () => syncFromSheets(false), isSyncing };
    
    switch (view) {
      case 'dashboard': 
        return <Dashboard members={members} songs={songs} schedules={schedules} {...syncProps} />;
      case 'members': 
        return <Members members={members} setMembers={setMembers} {...syncProps} />;
      case 'songs': 
        return <Songs songs={songs} setSongs={setSongs} {...syncProps} />;
      case 'schedules': 
        return <Schedules schedules={schedules} setSchedules={setSchedules} members={members} songs={songs} setSongs={setSongs} {...syncProps} />;
      default: 
        return null;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${hasFetchedFromCloud ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Cloud size={14} /> {hasFetchedFromCloud ? 'Nuvem Conectada' : 'Aguardando Nuvem'}
          </div>
          
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-emerald-600 animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Sincronizando...</span>
            </div>
          )}
          
          {syncStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-600 animate-in zoom-in" />}
          {syncStatus === 'error' && <AlertCircle size={16} className="text-red-600 animate-in bounce" />}
        </div>
        
        {hasFetchedFromCloud && (
          <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
            Total na Nuvem: {members.length} Membros
          </div>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;