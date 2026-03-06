import React, { useMemo } from 'react';
import { Schedule, Member, Song, ExternalEvent } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Trophy, 
  UserCheck, 
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Music
} from 'lucide-react';

interface ReportsProps {
  schedules: Schedule[];
  members: Member[];
  songs: Song[];
  events?: ExternalEvent[];
}

export const Reports: React.FC<ReportsProps> = ({ schedules = [], members = [], songs = [], events = [] }) => {
  const attendanceData = useMemo(() => {
    const stats: Record<string, { present: number, total: number }> = {};
    
    // Initialize stats for all members
    members.forEach(m => {
      stats[m.id] = { present: 0, total: 0 };
    });

    // Count regular schedules
    schedules.forEach(s => {
      // Only count schedules that are confirmed or passed
      const isPassed = new Date(s.date + 'T00:00:00') <= new Date();
      if (!isPassed && !s.confirmed) return;

      s.members.forEach(mId => {
        if (stats[mId]) {
          stats[mId].total += 1;
          
          // Check if marked as present in assignments
          const assignment = s.assignments.find(a => a.memberId === mId);
          if (assignment?.present) {
            stats[mId].present += 1;
          }
        }
      });
    });

    // Count external events
    events.forEach(e => {
      if (e.status !== 'confirmed') return;
      
      const isPassed = new Date(e.date + 'T00:00:00') <= new Date();
      if (!isPassed) return;

      if (e.memberIds) {
        e.memberIds.forEach((mId: string) => {
          if (stats[mId]) {
            stats[mId].total += 1;
            stats[mId].present += 1; // For external events, if they are in the list, we assume they were there
          }
        });
      }
    });

    return Object.entries(stats)
      .map(([id, data]) => {
        const member = members.find(m => m.id === id);
        return {
          name: member?.name || 'Desconhecido',
          present: data.present,
          total: data.total,
          percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [schedules, members]);

  const ministerStats = useMemo(() => {
    const counts: Record<string, number> = {};
    
    schedules.forEach(s => {
      if (s.leaderIds) {
        s.leaderIds.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([id, count]) => ({
        name: members.find(m => m.id === id)?.name || 'Desconhecido',
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [schedules, members]);

  const keyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    songs.forEach((s: any) => {
      if (s.key) {
        const k = s.key.toUpperCase().trim();
        counts[k] = (counts[k] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [songs]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900">Relatórios</h2>
        <p className="text-slate-500 font-medium">Análise de presença e liderança.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Relatório de Ministros */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-50 p-2 rounded-lg"><Award size={18} className="text-emerald-600" /></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Ranking de Ministros</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            {ministerStats.length > 0 ? (
              ministerStats.map((stat, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800">{stat.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.count} ministrações</p>
                  </div>
                  <div className="text-right">
                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(stat.count / ministerStats[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-slate-400 font-bold italic">Nenhum dado de ministração disponível.</p>
            )}
          </div>
        </div>

        {/* Gráfico de Presença */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-2 rounded-lg"><UserCheck size={18} className="text-blue-600" /></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Frequência de Presença (%)</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={40}>
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Tons */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-50 p-2 rounded-lg"><Music size={18} className="text-purple-600" /></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Distribuição de Tons</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={keyStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {keyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada de Presença */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-lg"><FileText size={18} className="text-slate-400" /></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Relatório Detalhado de Presença</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Integrante</th>
                <th className="px-10 py-6 text-center">Presenças</th>
                <th className="px-10 py-6 text-center">Escalas Totais</th>
                <th className="px-10 py-6 text-right">Frequência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendanceData.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-10 py-6 font-black text-slate-800">{m.name}</td>
                  <td className="px-10 py-6 text-center font-bold text-emerald-600">{m.present}</td>
                  <td className="px-10 py-6 text-center font-bold text-slate-500">{m.total}</td>
                  <td className="px-10 py-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${m.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : m.percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {m.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
