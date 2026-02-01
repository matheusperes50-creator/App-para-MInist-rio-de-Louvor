
import React, { useMemo } from 'react';
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
import { Music, Users, Calendar, Trophy, RefreshCw } from 'lucide-react';

interface DashboardProps {
  members: Member[];
  songs: Song[];
  schedules: Schedule[];
  onSync: () => void;
  isSyncing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ members, songs, schedules, onSync, isSyncing }) => {
  const memberParticipation = useMemo(() => {
    const participation: Record<string, number> = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    schedules.forEach(sch => {
      const schDate = new Date(sch.date);
      if (schDate.getMonth() === currentMonth && schDate.getFullYear() === currentYear) {
        sch.members.forEach(mId => {
          participation[mId] = (participation[mId] || 0) + 1;
        });
      }
    });

    return members
      .map(m => ({
        name: m.name,
        count: participation[m.id] || 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [members, schedules]);

  const topSongs = useMemo(() => {
    const counts: Record<string, number> = {};
    schedules.forEach(sch => {
      sch.songs.forEach(sId => {
        counts[sId] = (counts[sId] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([sId, count]) => {
        const song = songs.find(s => s.id === sId);
        return {
          title: song ? song.title : 'Desconhecida',
          artist: song ? song.artist : '-',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [songs, schedules]);

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
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} />
          {isSyncing ? 'Buscando Dados...' : 'Importar da Planilha'}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Membros</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Music size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Repertório</p>
            <p className="text-2xl font-bold">{songs.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-pink-50 p-3 rounded-xl text-pink-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Escalas</p>
            <p className="text-2xl font-bold">{schedules.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Músicas Tocadas</p>
            <p className="text-2xl font-bold">{schedules.reduce((acc, s) => acc + s.songs.length, 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Participação dos Membros (Mês Atual)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberParticipation}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Músicas mais Tocadas</h3>
          <div className="space-y-4">
            {topSongs.length > 0 ? topSongs.map((song, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm
                  ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{song.title}</p>
                  <p className="text-xs text-slate-500">{song.artist}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">{song.count}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Vezes</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400">Nenhuma música registrada.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
