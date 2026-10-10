import React, { useState, useRef } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Check, 
  Copy, 
  Share2, 
  Link2, 
  FileSpreadsheet, 
  RotateCcw, 
  Settings as SettingsIcon,
  ShieldCheck,
  CalendarCheck,
  Users,
  Music,
  CalendarDays
} from 'lucide-react';
import { Member, Song, Schedule, AttendanceEvent } from '../types';

interface SettingsProps {
  onSync: (forceReplace?: boolean) => Promise<void>;
  isSyncing: boolean;
  syncStatus: 'idle' | 'success' | 'error';
  hasFetchedFromCloud: boolean;
  members: Member[];
  songs: Song[];
  schedules: Schedule[];
  attendanceEvents: AttendanceEvent[];
  isAdmin: boolean;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRestoreDefaults: () => Promise<void>;
  restoreFeedback: string | null;
}

export const Settings: React.FC<SettingsProps> = ({
  onSync,
  isSyncing,
  syncStatus,
  hasFetchedFromCloud,
  members = [],
  songs = [],
  schedules = [],
  attendanceEvents = [],
  isAdmin,
  onExportBackup,
  onImportBackup,
  onRestoreDefaults,
  restoreFeedback
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Alteração de senha admin
  const [showPassChange, setShowPassChange] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getDirectAttendanceUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?view=presenca`;
  };

  const handleCopyDirectLink = async () => {
    const url = getDirectAttendanceUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Link direto copiado! Cole no WhatsApp para os participantes confirmarem presença.');
    } catch {
      showToast(`Link: ${url}`);
    }
  };

  const handleShareDirectLink = async () => {
    const url = getDirectAttendanceUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Confirmação de Presença - Ministério de Louvor',
          text: 'Olá equipe! Por favor, confirmem as datas em que podem servir:',
          url
        });
      } catch (err) {}
    } else {
      handleCopyDirectLink();
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass.length === 4) {
      localStorage.setItem('louvor_admin_password', newAdminPass);
      setPassFeedback('Senha alterada com sucesso!');
      setNewAdminPass('');
      setTimeout(() => {
        setPassFeedback(null);
        setShowPassChange(false);
      }, 2500);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Configurações do Sistema
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gestão de dados, sincronização com a planilha Google e cópias de segurança
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 ${
            hasFetchedFromCloud 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Cloud size={14} />
            {hasFetchedFromCloud ? 'Planilha Conectada' : 'Modo Offline'}
          </span>
        </div>
      </div>

      {restoreFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} /> {restoreFeedback}
        </div>
      )}

      {/* SEÇÃO 1: BANCO DE DADOS & PLANILHA GOOGLE */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Banco de Dados Google Sheets
            </h2>
            <p className="text-xs text-slate-400">
              Sincronização em tempo real com a planilha mestre do ministério
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <Users size={16} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-xl font-black text-slate-900 block">{members.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Integrantes</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <Music size={16} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-xl font-black text-slate-900 block">{songs.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Músicas</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <CalendarDays size={16} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-xl font-black text-slate-900 block">{schedules.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Escalas</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <CalendarCheck size={16} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-xl font-black text-slate-900 block">{attendanceEvents.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enquetes</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onSync(false)}
            disabled={isSyncing}
            className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            Recarregar Planilha Oficial
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja recarregar a planilha descartando rascunhos não salvos?')) {
                onSync(true);
              }
            }}
            disabled={isSyncing}
            className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database size={16} className="text-slate-500" />
            Forçar Restauração da Planilha
          </button>
        </div>

        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-slate-600 leading-relaxed space-y-1">
          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            Histórico Automático do Google Sheets
          </p>
          <p>
            O Google Sheets salva o histórico completo de todas as alterações feitas. Se você precisar reverter alterações antigas na planilha, basta abrir sua planilha no Google Drive e clicar em <strong>Arquivo &gt; Histórico de versões</strong> (<kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px]">Ctrl + Alt + Shift + H</kbd>).
          </p>
        </div>
      </div>

      {/* SEÇÃO 2: BACKUP E RESTAURAÇÃO EM ARQUIVO (JSON) */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Cópias de Segurança (Backup Local)
            </h2>
            <p className="text-xs text-slate-400">
              Salve ou restaure seus dados diretamente em arquivos JSON no seu computador
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Exportar Backup</h3>
              <p className="text-xs text-slate-500">
                Baixa um arquivo com todos os integrantes, repertório, escalas e presenças salvas.
              </p>
            </div>
            <button
              onClick={onExportBackup}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              Baixar Arquivo JSON
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Restaurar Backup</h3>
              <p className="text-xs text-slate-500">
                Envie um arquivo JSON salvo anteriormente para restaurar todas as informações no aplicativo.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportBackup}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload size={14} className="text-emerald-600" />
                Carregar Arquivo JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: LINK DIRETO DA ENQUETE DE PRESENÇA */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Link2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Link Direto da Presença para os Participantes
            </h2>
            <p className="text-xs text-slate-400">
              Compartilhe com a equipe no WhatsApp para votarem sem precisar de senha
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-slate-600 truncate bg-white px-3 py-2 rounded-xl border border-slate-200 flex-1">
            {getDirectAttendanceUrl()}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyDirectLink}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Copy size={14} /> Copiar Link
            </button>
            <button
              onClick={handleShareDirectLink}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Compartilhar"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: SENHA DE ADMINISTRADOR */}
      {isAdmin && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Senha do Administrador
                </h2>
                <p className="text-xs text-slate-400">
                  Código PIN de 4 dígitos para acesso às funções administrativas
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPassChange(!showPassChange)}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {showPassChange ? 'Fechar' : 'Alterar Senha'}
            </button>
          </div>

          {showPassChange && (
            <form onSubmit={handleChangePassword} className="space-y-4 pt-2 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nova senha (4 dígitos)"
                  className="bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-sm tracking-widest outline-none flex-1"
                />
                <button
                  type="submit"
                  disabled={newAdminPass.length < 4}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </div>
              {passFeedback && (
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} /> {passFeedback}
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* SEÇÃO 5: RESTAURAÇÃO DE EMERGÊNCIA */}
      {isAdmin && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-rose-500" />
                Restauração de Emergência (Dados Padrão PIBJE)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Restaura os dados originais cadastrados de integrantes, repertório e escalas
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Atenção: Deseja restaurar os dados originais do Ministério PIBJE? Essa ação substituirá os dados locais atuais.')) {
                  onRestoreDefaults();
                }
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
            >
              Restaurar Padrão PIBJE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
