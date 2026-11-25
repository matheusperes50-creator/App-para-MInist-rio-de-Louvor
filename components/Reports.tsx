import React, { useMemo, useState } from 'react';
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
  Users, 
  Calendar, 
  UserCheck, 
  FileText,
  Music,
  Mic,
  Mic2,
  Search,
  X,
  Guitar,
  Trophy,
  ShieldAlert,
  Filter,
  ChevronDown,
  ChevronUp,
  Piano,
  Drum,
  Zap
} from 'lucide-react';

interface ReportsProps {
  schedules: Schedule[];
  members: Member[];
  songs: Song[];
  events?: ExternalEvent[];
  isAdmin?: boolean;
}

const NON_INSTRUMENTAL_ROLES = new Set([
  'ministro',
  'vocal líder',
  'vocal lider',
  'vocal',
  'backing',
  'backing vocal'
]);

const formatMonthLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`;
};

const getScheduledMemberIds = (s: Schedule): string[] => {
  const ids = new Set<string>();
  (s.members || []).forEach(id => { if (id) ids.add(id); });
  (s.leaderIds || []).forEach(id => { if (id) ids.add(id); });
  (s.vocalIds || []).forEach(id => { if (id) ids.add(id); });
  (s.assignments || []).forEach(a => { if (a.memberId) ids.add(a.memberId); });
  return Array.from(ids);
};

export const Reports: React.FC<ReportsProps> = ({
  schedules = [],
  members = [],
  songs = [],
  events = [],
  isAdmin = false
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'count' | 'percentage'>('count');
  const [expandedInstrumentalistId, setExpandedInstrumentalistId] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    schedules.forEach(s => {
      if (s?.date && s.date.length >= 7) {
        months.add(s.date.slice(0, 7));
      }
    });
    events.forEach(e => {
      if (e.status === 'confirmed' && e?.date && e.date.length >= 7) {
        months.add(e.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [schedules, events]);

  const filteredSchedules = useMemo(() => {
    if (selectedMonth === 'all') return schedules;
    return schedules.filter(s => s?.date?.startsWith(selectedMonth));
  }, [schedules, selectedMonth]);

  const confirmedFilteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.status !== 'confirmed') return false;
      if (selectedMonth === 'all') return true;
      return e.date?.startsWith(selectedMonth);
    });
  }, [events, selectedMonth]);

  // Ranking: Quem mais ministrou
  const ministerStats = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredSchedules.forEach(s => {
      const ministerIds = new Set<string>();
      (s.leaderIds || []).forEach(id => {
        if (id) ministerIds.add(id);
      });
      (s.assignments || []).forEach(a => {
        const roleLower = (a.role || '').trim().toLowerCase();
        if (a.memberId && (roleLower === 'ministro' || roleLower === 'vocal líder' || roleLower === 'vocal lider')) {
          ministerIds.add(a.memberId);
        }
      });

      ministerIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const member = members.find(m => m.id === id);
        return {
          id,
          name: member?.name || 'Desconhecido',
          photoUrl: member?.photoUrl,
          count
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filteredSchedules, members]);

  // Ranking: Quem mais tocou (instrumental)
  const instrumentalStats = useMemo(() => {
    const stats: Record<string, { count: number; instruments: Record<string, number> }> = {};

    filteredSchedules.forEach(s => {
      const memberRolesInSchedule = new Map<string, string[]>();

      (s.assignments || []).forEach(a => {
        if (!a.memberId || !a.role) return;
        const cleanRole = a.role.trim();
        const roleLower = cleanRole.toLowerCase();
        if (!NON_INSTRUMENTAL_ROLES.has(roleLower)) {
          const existing = memberRolesInSchedule.get(a.memberId) || [];
          if (!existing.includes(cleanRole)) {
            existing.push(cleanRole);
          }
          memberRolesInSchedule.set(a.memberId, existing);
        }
      });

      memberRolesInSchedule.forEach((rolesList, id) => {
        if (!stats[id]) {
          stats[id] = { count: 0, instruments: {} };
        }
        stats[id].count += 1;
        rolesList.forEach(roleName => {
          stats[id].instruments[roleName] = (stats[id].instruments[roleName] || 0) + 1;
        });
      });
    });

    return Object.entries(stats)
      .map(([id, data]) => {
        const member = members.find(m => m.id === id);
        const instrumentsBreakdown = Object.entries(data.instruments)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
          .map(([roleName, qty]) => ({ name: roleName, count: qty }));

        const instrumentsList = instrumentsBreakdown.map(item =>
          instrumentsBreakdown.length > 1 ? `${item.name} (${item.count})` : item.name
        );

        return {
          id,
          name: member?.name || 'Desconhecido',
          photoUrl: member?.photoUrl,
          count: data.count,
          instrumentsLabel: instrumentsList.join(' • '),
          instrumentsBreakdown
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filteredSchedules, members]);

  // Ranking: Quem mais esteve entre os Backs Vocals
  const vocalStats = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredSchedules.forEach(s => {
      const vocalIds = new Set<string>();
      (s.vocalIds || []).forEach(id => {
        if (id) vocalIds.add(id);
      });
      (s.assignments || []).forEach(a => {
        const roleLower = (a.role || '').trim().toLowerCase();
        if (a.memberId && (roleLower === 'vocal' || roleLower === 'backing' || roleLower === 'backing vocal')) {
          vocalIds.add(a.memberId);
        }
      });

      vocalIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const member = members.find(m => m.id === id);
        return {
          id,
          name: member?.name || 'Desconhecido',
          photoUrl: member?.photoUrl,
          count
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filteredSchedules, members]);

  // Presença Escalada: considera presença todo integrante escalado e mantido na escala
  const scheduledPresenceData = useMemo(() => {
    const counts: Record<string, number> = {};

    members.forEach(m => {
      if (m.isActive) counts[m.id] = 0;
    });

    filteredSchedules.forEach(s => {
      const scheduledIds = getScheduledMemberIds(s);
      scheduledIds.forEach(mId => {
        counts[mId] = (counts[mId] || 0) + 1;
      });
    });

    confirmedFilteredEvents.forEach(e => {
      const uniqueEventMembers = new Set<string>(e.memberIds || []);
      uniqueEventMembers.forEach(mId => {
        if (mId) counts[mId] = (counts[mId] || 0) + 1;
      });
    });

    const totalOpportunities = filteredSchedules.length + confirmedFilteredEvents.length;
    const ministerMap = new Map(ministerStats.map(item => [item.id, item.count]));
    const instrumentalMap = new Map(instrumentalStats.map(item => [item.id, item.count]));
    const vocalMap = new Map(vocalStats.map(item => [item.id, item.count]));

    const rawList = Object.entries(counts)
      .map(([id, presences]) => {
        const member = members.find(m => m.id === id);
        return {
          id,
          name: member?.name || 'Desconhecido',
          presences,
          totalOpportunities,
          ministerCount: ministerMap.get(id) || 0,
          instrumentalCount: instrumentalMap.get(id) || 0,
          vocalCount: vocalMap.get(id) || 0,
          percentage: totalOpportunities > 0 ? Math.round((presences / totalOpportunities) * 100) : 0
        };
      })
      .sort((a, b) => b.presences - a.presences || a.name.localeCompare(b.name, 'pt-BR'));

    // Generate unique short labels for chart X-axis
    const firstNamesCount: Record<string, number> = {};
    rawList.forEach(item => {
      const first = item.name.split(' ')[0];
      firstNamesCount[first] = (firstNamesCount[first] || 0) + 1;
    });

    return rawList.map(item => {
      const parts = item.name.trim().split(/\s+/);
      const first = parts[0] || item.name;
      const chartName =
        firstNamesCount[first] > 1 && parts.length > 1
          ? `${first} ${parts[1].charAt(0)}.`
          : first;

      return {
        ...item,
        chartName
      };
    });
  }, [filteredSchedules, confirmedFilteredEvents, members, ministerStats, instrumentalStats, vocalStats]);

  const chartPresenceSlice = useMemo(() => {
    const withPresences = scheduledPresenceData.filter(d => d.presences > 0);
    return (withPresences.length > 0 ? withPresences : scheduledPresenceData).slice(0, 10);
  }, [scheduledPresenceData]);

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

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

  const memberSchedules = useMemo(() => {
    if (!selectedMemberId) return [];
    return filteredSchedules
      .filter(s => getScheduledMemberIds(s).includes(selectedMemberId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSchedules, selectedMemberId]);

  const selectedMember = useMemo(
    () => members.find(m => m.id === selectedMemberId),
    [members, selectedMemberId]
  );

  // Proteção estrita: apenas administradores podem visualizar relatórios
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Acesso Restrito</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          Os rankings e relatórios de presença escalada estão disponíveis exclusivamente para administradores.
        </p>
      </div>
    );
  }

  const totalEscalasPeriodo = filteredSchedules.length + confirmedFilteredEvents.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Relatórios</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Rankings ministeriais e presença escalada (visível apenas para administradores).
          </p>
        </div>

        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Filter size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              aria-label="Filtrar relatórios por período"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Todos os Períodos
              </option>
              {availableMonths.map(month => (
                <option key={month} value={month} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Escalas no Período</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalEscalasPeriodo}</p>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredSchedules.length} cultos • {confirmedFilteredEvents.length} eventos
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Mic size={12} className="text-emerald-500" /> Quem Mais Ministrou
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white truncate">
            {ministerStats[0]?.name || '—'}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {ministerStats[0] ? `${ministerStats[0].count} ${ministerStats[0].count === 1 ? 'ministração' : 'ministrações'}` : 'Sem registros'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Guitar size={12} className="text-amber-500" /> Quem Mais Tocou
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white truncate">
            {instrumentalStats[0]?.name || '—'}
          </p>
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
            {instrumentalStats[0] ? `${instrumentalStats[0].count} ${instrumentalStats[0].count === 1 ? 'participação' : 'participações'}` : 'Sem registros'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Mic2 size={12} className="text-indigo-500" /> Mais Backs Vocals
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white truncate">
            {vocalStats[0]?.name || '—'}
          </p>
          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {vocalStats[0] ? `${vocalStats[0].count} ${vocalStats[0].count === 1 ? 'participação' : 'participações'}` : 'Sem registros'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
            <Trophy size={12} className="text-blue-500" /> Maior Presença Escalada
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white truncate">
            {scheduledPresenceData[0]?.presences ? scheduledPresenceData[0].name : '—'}
          </p>
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">
            {scheduledPresenceData[0]?.presences ? `${scheduledPresenceData[0].presences} escalas (${scheduledPresenceData[0].percentage}%)` : 'Sem registros'}
          </p>
        </div>
      </div>

      {/* Rankings: Quem Mais Ministrou, Quem Mais Tocou (Instrumental) & Backs Vocals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking de Ministros (Quem mais ministrou) */}
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl shrink-0">
                <Mic size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest truncate">
                  Quem Mais Ministrou
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold truncate">Ranking de ministração</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full shrink-0">
              {ministerStats.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {ministerStats.length > 0 ? (
              ministerStats.map((stat, index) => (
                <div
                  key={stat.id}
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-slate-600 transition-all"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shrink-0 ${
                      index === 0
                        ? 'bg-amber-400 text-white'
                        : index === 1
                        ? 'bg-slate-400 text-white'
                        : index === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{stat.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {stat.count} {stat.count === 1 ? 'ministração' : 'ministrações'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="h-2 w-16 sm:w-20 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(stat.count / ministerStats[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-slate-400 font-bold italic">Nenhum dado de ministração disponível.</p>
            )}
          </div>
        </div>

        {/* Ranking Instrumental (Quem mais tocou) */}
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl shrink-0">
                <Guitar size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest truncate">
                  Quem Mais Tocou (Instrumental)
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold truncate">Toque no nome para ver os instrumentos</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full shrink-0">
              {instrumentalStats.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {instrumentalStats.length > 0 ? (
              instrumentalStats.map((stat, index) => {
                const isExpanded = expandedInstrumentalistId === stat.id;
                const getInstrumentIcon = (instrumentName: string) => {
                  const lower = instrumentName.toLowerCase();
                  if (lower.includes('teclado') || lower.includes('piano')) return Piano;
                  if (lower.includes('bateria')) return Drum;
                  if (lower.includes('guitarra')) return Zap;
                  if (lower.includes('violão') || lower.includes('violao')) return Guitar;
                  return Music;
                };

                return (
                  <div
                    key={stat.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/70'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedInstrumentalistId(prev => (prev === stat.id ? null : stat.id))}
                      className="w-full flex items-center gap-3 p-3.5 text-left cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shrink-0 ${
                          index === 0
                            ? 'bg-amber-400 text-white'
                            : index === 1
                            ? 'bg-slate-400 text-white'
                            : index === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {index + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 dark:text-white text-sm truncate">{stat.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          {stat.count} {stat.count === 1 ? 'vez' : 'vezes'}
                          {stat.instrumentsLabel ? ` • ${stat.instrumentsLabel}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-2 w-12 sm:w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${(stat.count / instrumentalStats[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-400 dark:text-slate-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-amber-200/70 dark:border-amber-800/40 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                          Instrumentos tocados ({stat.count} {stat.count === 1 ? 'escala' : 'escalas'})
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {stat.instrumentsBreakdown.map(inst => {
                            const InstIcon = getInstrumentIcon(inst.name);
                            const pct = stat.count > 0 ? Math.round((inst.count / stat.count) * 100) : 0;
                            return (
                              <div
                                key={inst.name}
                                className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-amber-100 dark:border-slate-700/80"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <InstIcon size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                    {inst.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {pct}%
                                  </span>
                                  <span className="text-xs font-black bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-lg">
                                    {inst.count} {inst.count === 1 ? 'vez' : 'vezes'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center py-12 text-slate-400 font-bold italic">Nenhum dado instrumental disponível.</p>
            )}
          </div>
        </div>

        {/* Ranking de Backs Vocals */}
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl shrink-0">
                <Mic2 size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest truncate">
                  Quem Mais Foi Back Vocal
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold truncate">Ranking nos backs vocals</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full shrink-0">
              {vocalStats.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {vocalStats.length > 0 ? (
              vocalStats.map((stat, index) => (
                <div
                  key={stat.id}
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-200 dark:hover:border-slate-600 transition-all"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shrink-0 ${
                      index === 0
                        ? 'bg-amber-400 text-white'
                        : index === 1
                        ? 'bg-slate-400 text-white'
                        : index === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{stat.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {stat.count} {stat.count === 1 ? 'vez nos backs' : 'vezes nos backs'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="h-2 w-16 sm:w-20 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(stat.count / vocalStats[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-slate-400 font-bold italic">Nenhum dado de backing vocal disponível.</p>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Presença Escalada & Distribuição de Tons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Presença Escalada */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-xl">
                <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                  Presença Escalada
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Presença automática por nome mantido na escala
                </p>
              </div>
            </div>

            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMetric('count')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  chartMetric === 'count'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Escalas
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('percentage')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  chartMetric === 'percentage'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                % Part.
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            {chartPresenceSlice.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPresenceSlice} margin={{ top: 15, right: 16, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="chartName"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={55}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={chartMetric === 'percentage' ? [0, 100] : [0, 'auto']}
                    tickFormatter={(val) => (chartMetric === 'percentage' ? `${val}%` : `${val}`)}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#334155', opacity: 0.1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-black text-white">{item.name}</p>
                          <p className="text-emerald-400 font-bold">
                            Presenças escaladas: {item.presences}
                          </p>
                          <p className="text-slate-300 font-medium">
                            Participação: {item.percentage}% de {item.totalOpportunities} escalas
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={chartMetric === 'count' ? 'presences' : 'percentage'}
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  >
                    {chartPresenceSlice.map((entry, index) => (
                      <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold italic text-sm">
                Nenhuma escala registrada neste período.
              </div>
            )}
          </div>
        </div>

        {/* Distribuição de Tons */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-50 dark:bg-purple-950/60 p-2.5 rounded-xl">
              <Music size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                Distribuição de Tons
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">Tonalidades do repertório cadastrado</p>
            </div>
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
                  contentStyle={{
                    borderRadius: '1rem',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Busca por Integrante */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg">
            <Search size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
            Busca por Integrante
          </h3>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Digite o nome do integrante..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-bold transition-all placeholder-slate-400"
          />
          {memberSearch && (
            <button
              onClick={() => setMemberSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {memberSearch.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {members
              .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
              .slice(0, 6)
              .map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setMemberSearch('');
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    selectedMemberId === m.id
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs overflow-hidden">
                    {m.photoUrl ? <img src={m.photoUrl} alt="" className="w-full h-full object-cover" /> : m.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm truncate">{m.name}</span>
                </button>
              ))}
          </div>
        )}

        {selectedMemberId && (
          <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center overflow-hidden">
                  {selectedMember?.photoUrl ? (
                    <img src={selectedMember.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedMember?.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Histórico de Presença Escalada ({memberSchedules.length} {memberSchedules.length === 1 ? 'escala' : 'escalas'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-3">
              {memberSchedules.length > 0 ? (
                memberSchedules.map(s => {
                  const memberRoles = Array.from(
                    new Set(
                      (s.assignments || [])
                        .filter(a => a.memberId === selectedMemberId && a.role)
                        .map(a => a.role)
                    )
                  );
                  if (memberRoles.length === 0) {
                    if ((s.leaderIds || []).includes(selectedMemberId)) memberRoles.push('Ministro');
                    else if ((s.vocalIds || []).includes(selectedMemberId)) memberRoles.push('Vocal');
                    else memberRoles.push('Integrante');
                  }

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 border border-slate-100 dark:border-slate-600">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white text-sm">
                            {new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.serviceType}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg inline-block">
                          {memberRoles.join(' • ')}
                        </p>
                        <span className="text-emerald-500" title="Presença Escalada">
                          <UserCheck size={15} className="inline" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-slate-400 font-bold italic text-sm">
                  Nenhuma escala encontrada para este integrante no período.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabela Detalhada de Presença Escalada */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <FileText size={18} className="text-slate-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                Relatório Detalhado de Presença Escalada
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Contagem de escalas em que cada integrante esteve escalado e mantido
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 sm:px-10 py-5">Integrante</th>
                <th className="px-4 sm:px-6 py-5 text-center">Presenças Escaladas</th>
                <th className="px-4 sm:px-6 py-5 text-center">Ministrações</th>
                <th className="px-4 sm:px-6 py-5 text-center">Instrumental</th>
                <th className="px-4 sm:px-6 py-5 text-center">Backs Vocals</th>
                <th className="px-6 sm:px-10 py-5 text-right">Participação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {scheduledPresenceData.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
                  <td className="px-6 sm:px-10 py-5 font-black text-slate-800 dark:text-white">{m.name}</td>
                  <td className="px-4 sm:px-6 py-5 text-center font-black text-emerald-600 dark:text-emerald-400">
                    {m.presences}
                  </td>
                  <td className="px-4 sm:px-6 py-5 text-center font-bold text-slate-600 dark:text-slate-300">
                    {m.ministerCount}
                  </td>
                  <td className="px-4 sm:px-6 py-5 text-center font-bold text-amber-600 dark:text-amber-400">
                    {m.instrumentalCount}
                  </td>
                  <td className="px-4 sm:px-6 py-5 text-center font-bold text-indigo-600 dark:text-indigo-400">
                    {m.vocalCount}
                  </td>
                  <td className="px-6 sm:px-10 py-5 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        m.percentage >= 50
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : m.percentage >= 25
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
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
