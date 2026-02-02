import React, { useState, useMemo } from 'react';
import { Song, Schedule } from '../types';
import { Music, Search, Trash2, Hash, Library, RefreshCw, Calendar, Sparkles } from 'lucide-react';

interface SongsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  schedules: Schedule[];
  onSync: () => void;
  isSyncing: boolean;
}

export const Songs: React.FC<SongsProps> = ({ songs = [], setSongs, schedules = [], onSync, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const removeSong = (id: string) => {
    if (confirm('Excluir música do repertório? Isso não afetará as escalas já criadas, mas a música sumirá das estatísticas.')) {
      setSongs(prev => prev.filter(s => s.id !== id));
    }
  };

  const songsStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const stats: Record<string, { last30Days: number, allKeys: Set<string> }> = {};

    schedules.forEach(sch => {
      if (!sch.date || !Array.isArray(sch.songs)) return;
      
      const schDate = new Date(sch.date);
      const isRecent = schDate >= thirtyDaysAgo;

      sch.songs.forEach(songData => {
        const sId = typeof songData === 'string' ? songData : songData.id;
        const sKey = typeof songData === 'string' ? '' : songData.key;

        if (!stats[sId]) {
          stats[sId] = { last30Days: 0, allKeys: new Set() };
        }

        if (isRecent) {
          stats[sId].last30Days += 1;
        }

        if (sKey) {
          stats[sId].allKeys.add(sKey);
        } else {
          // Se for formato antigo sem key na escala, tenta pegar a key original do objeto Song mais tarde
        }
      });
    });

    return stats;
  }, [schedules]);

  const filteredSongs = (songs || []).filter(s => {
    const term = searchTerm.toLowerCase();
    const title = (s.title || "").toLowerCase();
    const artist = (s.artist || "").toLowerCase();
    return title.includes(term) || artist.includes(term);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Repertório</h2>
          <p className="text-slate-500 font-medium">Análise de execuções e tons utilizados.</p>
        </div>
        <button 
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} />
          {isSyncing ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar no repertório..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white border border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-lg font-medium"
        />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-6 text-slate-400">
          <Library size={20} />
          <h3 className="font-black uppercase tracking-widest text-[10px]">Biblioteca Musical ({(songs || []).length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredSongs.map((song) => {
            const stat = songsStats[song.id] || { last30Days: 0, allKeys: new Set() };
            const keysArray = Array.from(stat.allKeys);
            // Adiciona o tom padrão se não estiver no histórico
            if (song.key && !stat.allKeys.has(song.key)) {
              keysArray.unshift(song.key);
            }

            return (
              <div key={song.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
                {stat.last30Days > 0 && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter">
                    🔥 Ativa
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
                    <Music size={24} />
                  </div>
                  <button 
                    onClick={() => removeSong(song.id)}
                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1">
                  <h4 className="font-black text-slate-800 text-xl leading-tight line-clamp-2">{song.title}</h4>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mt-1">{song.artist !== 'Manual' ? song.artist : 'Repertório Local'}</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Últimos 30 dias</span>
                    </div>
                    <span className={`text-lg font-black ${stat.last30Days > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {stat.last30Days}x
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tons Utilizados</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {keysArray.length > 0 ? keysArray.map((k, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${k === song.key ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          {k}
                        </span>
                      )) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">Nenhum registro</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredSongs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
              <Library size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Repertório não encontrado</p>
              <p className="text-[10px] text-slate-300 mt-2 font-medium">As músicas são cadastradas automaticamente ao criar escalas.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};