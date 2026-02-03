import React, { useMemo, useState } from 'react';
import { Member, Song, Schedule } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { Music, Users, Calendar, Trophy, RefreshCw, Filter } from 'lucide-react';

interface DashboardProps {
  members: Member[];
  songs: Song[];
  schedules: Schedule[];
  onSync: () => void;
  isSyncing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  members = [], 
  songs = [], 
  schedules = [], 
  onSync, 
  isSyncing 
}) => {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeMembers = Array.isArray(members) ? members : [];
  const safeSongs = Array.isArray(songs) ? songs : [];

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    safeSchedules.forEach(s => {
      if (s.date) {
        const [year, month] = s.date.split('-');
        months.add(`${year}-${month}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [safeSchedules]);

  const formatMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`;
  };

  const memberParticipation = useMemo(() => {
    const participation: Record<string, number> = {};

    safeSchedules.forEach(sch => {
      if (!sch || !sch.date) return;
      
      const isMatch = selectedMonthFilter === 'all' || sch.date.startsWith(selectedMonthFilter);
      
      if (isMatch) {
        // Usar Set para garantir que um membro não conte 2x na mesma escala (se tiver 2 funções)
        const uniqueMembersInSchedule = new Set(sch.members || []);
        uniqueMembersInSchedule.forEach(mId => {
          if (mId) participation[mId] = (participation[mId] || 0) + 1;
        });
      }
    });

    return safeMembers
      .map(m => ({
        name: m.name || 'Sem Nome',
        count: participation[m.id] || 0
      }))
      .filter(m => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [safeMembers, safeSchedules, selectedMonthFilter]);

  const topSongs = useMemo(() => {
    const counts: Record<string, number> = {};
    safeSchedules.forEach(sch => {
      if (sch && Array.isArray(sch.songs)) {
        sch.songs.forEach(songData => {
          const sId = typeof songData === 'string' ? songData : songData.id;
          if (sId) counts[sId] = (counts[sId] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([sId, count]) => {
        const song = safeSongs.find(s => s.id === sId);
        return {
          title: song ? song.title : 'Desconhecida',
          artist: song ? song.artist : '-',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [safeSongs, safeSchedules]);

  const totalSongsPlayed = useMemo(() => {
    return safeSchedules.reduce((acc, s) => acc + (Array.isArray(s?.songs) ? s.songs.length : 0), 0);
  }, [safeSchedules]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-sans">Visão Geral</h2>
          <p className="text-slate-500">Acompanhe as métricas do seu ministério.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Users size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Membros</p><p className="text-2xl font-bold">{safeMembers.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-teal-50 p-3 rounded-xl text-teal-600"><Music size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Repertório</p><p className="text-2xl font-bold">{safeSongs.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-700"><Calendar size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Escalas</p><p className="text-2xl font-bold">{safeSchedules.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-800"><Trophy size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Músicas Tocadas</p><p className="text-2xl font-bold">{totalSongsPlayed}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold">Participação dos Membros</h3>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar max-w-full">
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex gap-1">
                <button 
                  onClick={() => setSelectedMonthFilter('all')} 
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tight ${selectedMonthFilter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
                >
                  Todos
                </button>
                {availableMonths.slice(0, 3).map(month => (
                  <button 
                    key={month} 
                    onClick={() => setSelectedMonthFilter(month)} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tight whitespace-nowrap ${selectedMonthFilter === month ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
                  >
                    {month.split('-')[1]}/{month.split('-')[0].slice(2)}
                  </button>
                ))}
              </div>
              
              {availableMonths.length > 3 && (
                <select 
                  value={availableMonths.includes(selectedMonthFilter) ? selectedMonthFilter : 'all'}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-tight py-2 px-3 rounded-xl outline-none text-slate-500 focus:border-emerald-500"
                >
                  <option value="all">Ver mais...</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{formatMonthLabel(month)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberParticipation} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} 
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f0fdf4'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <Filter size={12} className="text-slate-300" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando: {selectedMonthFilter === 'all' ? 'Todo o período' : formatMonthLabel(selectedMonthFilter)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Músicas mais Tocadas</h3>
          <div className="space-y-4">
            {topSongs.length > 0 ? topSongs.map((song, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-emerald-400' : 'bg-emerald-300'}`}>{index + 1}</div>
                <div className="flex-1"><p className="font-bold text-slate-800 text-sm line-clamp-1">{song.title}</p><p className="text-xs text-slate-500">{song.artist}</p></div>
                <div className="text-right"><p className="text-lg font-bold text-emerald-600">{song.count}</p><p className="text-[10px] uppercase font-bold text-slate-400">Vezes</p></div>
              </div>
            )) : (<div className="text-center py-10 text-slate-400">Nenhuma música registrada nas escalas.</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};