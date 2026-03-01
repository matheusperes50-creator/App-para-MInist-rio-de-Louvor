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
  Cell
} from 'recharts';
import { Music, Users, Calendar, Trophy, RefreshCw, TrendingUp, Heart, Search, CalendarDays, Mic2, Music2 } from 'lucide-react';

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
  const [searchInputValue, setSearchInputValue] = useState('');
  const [confirmedSearchName, setConfirmedSearchName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.isActive).length;
  const totalSongs = songs.length;
  const totalSchedules = schedules.length;

  const nextSchedule = useMemo(() => {
    return [...schedules]
      .filter(s => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [schedules, today]);

  const suggestions = useMemo(() => {
    if (!searchInputValue.trim() || !showSuggestions) return [];
    const term = searchInputValue.toLowerCase();
    return members
      .filter(m => m.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [searchInputValue, members, showSuggestions]);

  const searchResults = useMemo(() => {
    if (!confirmedSearchName.trim()) return { schedules: [], matchingMemberIds: new Set<string>() };
    
    const term = confirmedSearchName.toLowerCase();
    const matchingMembers = members.filter(m => m.name.toLowerCase().includes(term));
    const matchingMemberIds = new Set(matchingMembers.map(m => m.id));
    
    const filteredSchedules = schedules
      .filter(s => s.date >= today) // Only upcoming
      .filter(s => s.members.some(mId => matchingMemberIds.has(mId)))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { schedules: filteredSchedules, matchingMemberIds };
  }, [confirmedSearchName, members, schedules, today]);

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

      {/* Próxima Escala e Busca */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Próxima Escala */}
        <div className="lg:col-span-2 bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={20} className="text-emerald-200" />
              <h3 className="font-black uppercase text-xs tracking-[0.2em] text-emerald-200">Próxima Escala</h3>
            </div>
            
            {nextSchedule ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h4 className="text-4xl font-black tracking-tighter mb-2">
                      {new Date(nextSchedule.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </h4>
                    <p className="text-emerald-100 font-bold text-lg uppercase tracking-widest">
                      {nextSchedule.serviceType}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] font-black uppercase text-emerald-300 mb-1">Ministro</p>
                      <p className="text-sm font-bold">
                        {nextSchedule.leaderIds.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(', ') || 'A definir'}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] font-black uppercase text-emerald-300 mb-1">Músicas</p>
                      <p className="text-sm font-bold">{nextSchedule.songs?.length || 0} canções</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-2 flex items-center gap-2">
                    <Users size={12} /> Equipe Completa
                  </p>
                  <p className="text-xs font-medium text-emerald-50 leading-relaxed">
                    {nextSchedule.members.map(id => members.find(m => m.id === id)?.name).filter(Boolean).join(' • ') || 'Nenhum integrante escalado'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-emerald-100 font-bold">Nenhuma escala futura agendada.</p>
            )}
          </div>
          <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Busca de Integrante */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col relative">
          <div className="flex items-center gap-2 mb-6">
            <Search size={20} className="text-slate-400" />
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Minha Escala</h3>
          </div>
          
          <div className="flex gap-2 mb-4 relative">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Digite seu nome..." 
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl py-4 px-6 outline-none font-bold transition-all"
              />
              
              {/* Sugestões */}
              {suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSearchInputValue(m.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-6 py-3 hover:bg-emerald-50 transition-colors font-bold text-slate-700 text-sm border-b border-slate-50 last:border-0"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setConfirmedSearchName(searchInputValue);
                setShowSuggestions(false);
              }}
              className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center shrink-0"
              title="Pesquisar"
            >
              <Search size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[180px] space-y-3 pr-2 custom-scrollbar">
            {confirmedSearchName.trim() ? (
              searchResults.schedules.length > 0 ? (
                searchResults.schedules.map(s => {
                  const memberAssignment = s.assignments.find(a => searchResults.matchingMemberIds.has(a.memberId));
                  const member = members.find(m => m.id === memberAssignment?.memberId);
                  
                  return (
                    <div key={s.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
                        {member?.photoUrl ? (
                          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users size={16} className="text-emerald-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                            {s.serviceType.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {memberAssignment?.role || 'Integrante'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase italic">Nenhuma escala futura encontrada para "{confirmedSearchName}".</p>
              )
            ) : (
              <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase italic">Busque seu nome para ver suas escalas.</p>
            )}
          </div>
        </div>
      </div>

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