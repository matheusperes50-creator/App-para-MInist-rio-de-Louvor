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
  Cell
} from 'recharts';
import { Music, Users, Calendar, Trophy, RefreshCw, TrendingUp, Heart } from 'lucide-react';

interface DashboardProps {
  members: Member[];
  songs: Song[];
  schedules: Schedule[];
  onSync: () => void;
  isSyncing: boolean;
  isAdmin: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  members = [], 
  songs = [], 
  schedules = [], 
  onSync, 
  isSyncing 
}) => {
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.isActive).length;
  const totalSongs = songs.length;
  const totalSchedules = schedules.length;

  const songStats = useMemo(() => {
    const counts: Record<string, number> = {};
    schedules.forEach(s => {
      if (!s.songs) return;
      s.songs.forEach(songData => {
        const id = typeof songData === 'string' ? songData : songData.id;
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([id, count]) => ({
        name: songs.find(s => s.id === id)?.title || 'Desconhecida',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [schedules, songs]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Dashboard</h2>
          <p className="text-slate-500 font-medium">Visão geral do ministério.</p>
        </div>
        <button 
          onClick={onSync}
          disabled={isSyncing}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
          title="Sincronizar dados"
        >
          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <Users size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Membros</p>
          <h4 className="text-3xl font-black text-slate-800">{totalMembers}</h4>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">{activeMembers} ativos</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Music size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Músicas no Repertório</p>
          <h4 className="text-3xl font-black text-slate-800">{totalSongs}</h4>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Escalas</p>
          <h4 className="text-3xl font-black text-slate-800">{totalSchedules}</h4>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
              <Trophy size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Música +Tocada</p>
          <h4 className="text-xl font-black text-slate-800 truncate">{songStats[0]?.name || '-'}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-50 p-2 rounded-lg"><TrendingUp size={18} className="text-slate-400" /></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Músicas mais executadas</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={songStats} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {songStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Gestão Ministerial</h3>
            <p className="text-emerald-200 text-sm font-medium mb-8 leading-relaxed">
              Mantenha os dados da sua equipe sempre atualizados para garantir uma escala equilibrada e um repertório diversificado.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black"><Heart size={18} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Dica Ministerial</p>
                  <p className="text-sm font-bold">Revise as escalas semanalmente</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};