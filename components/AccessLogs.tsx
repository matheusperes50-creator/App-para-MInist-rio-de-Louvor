import React from 'react';
import { AccessLog } from '../types';
import { Shield, Smartphone, Monitor, Clock, User, RefreshCw, History } from 'lucide-react';

interface AccessLogsProps {
  logs: AccessLog[];
  onSync: () => void;
  isSyncing: boolean;
  isAdmin: boolean;
}

export const AccessLogs: React.FC<AccessLogsProps> = ({ logs = [], onSync, isSyncing, isAdmin }) => {
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Shield size={48} className="mb-4 opacity-20" />
        <p className="font-black uppercase tracking-widest text-xs">Acesso Restrito</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Logs de Acesso</h2>
          <p className="text-slate-500 font-medium">Histórico de acessos por dispositivo.</p>
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

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Usuário</th>
                <th className="px-10 py-6">Dispositivo</th>
                <th className="px-10 py-6">Data/Hora</th>
                <th className="px-10 py-6">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{log.userEmail}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID: {log.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                      {log.device === 'Mobile' ? (
                        <Smartphone size={16} className="text-emerald-500" />
                      ) : (
                        <Monitor size={16} className="text-blue-500" />
                      )}
                      <span className="text-sm font-bold text-slate-600">{log.device}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={14} />
                      <span className="text-sm font-medium">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      log.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {log.role}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-200">
                      <History size={48} />
                      <p className="font-bold uppercase tracking-widest text-xs">Nenhum log encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
