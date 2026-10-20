import React, { useState, useEffect, useMemo } from 'react';
import { Member, UserRoleType } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  ChevronRight, 
  Music, 
  Mail, 
  RefreshCw, 
  Search, 
  X, 
  Check, 
  ArrowLeft, 
  User 
} from 'lucide-react';
import { DEFAULT_MEMBERS } from '../initialData';

interface LoginProps {
  onLogin: (role: UserRoleType, selectedMember?: Member) => void;
  members?: Member[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, members }) => {
  const [mode, setMode] = useState<'selection' | 'member-select' | 'password' | 'recovery'>('selection');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial password in localStorage if not exists
  useEffect(() => {
    if (!localStorage.getItem('louvor_admin_password')) {
      localStorage.setItem('louvor_admin_password', '1234');
    }
  }, []);

  // Filter only active registered members and sort alphabetically
  const activeMembers = useMemo(() => {
    let list: Member[] = [];
    if (members && members.length > 0) {
      list = members;
    } else {
      try {
        const saved = localStorage.getItem('louvor_members');
        if (saved) list = JSON.parse(saved);
        else list = DEFAULT_MEMBERS;
      } catch {
        list = DEFAULT_MEMBERS;
      }
    }
    return (list || [])
      .filter(m => m && m.isActive)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  }, [members]);

  // Last accessed member ID if saved
  const lastMemberId = useMemo(() => {
    try {
      return localStorage.getItem('louvor_current_member_id') || '';
    } catch {
      return '';
    }
  }, []);

  // Filtered members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return activeMembers;
    const term = searchTerm.toLowerCase().trim();
    return activeMembers.filter(m => 
      (m.name || '').toLowerCase().includes(term) ||
      (m.roles || []).some(r => r.toLowerCase().includes(term))
    );
  }, [activeMembers, searchTerm]);

  const handleSelectMember = (member: Member) => {
    try {
      localStorage.setItem('louvor_current_member_id', member.id);
      localStorage.setItem('louvor_current_member_name', member.name);
    } catch {}
    onLogin('member', member);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('louvor_admin_password') || '1234';
    
    if (password === storedPassword) {
      onLogin('admin');
    } else {
      setError('Senha incorreta. Tente novamente.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const masterEmail = 'matheusperes50@gmail.com'; // Lowercase for comparison
    
    if (recoveryEmail.trim().toLowerCase() === masterEmail) {
      localStorage.setItem('louvor_admin_password', '1234');
      setSuccess('Senha resetada com sucesso para: 1234');
      setTimeout(() => {
        setSuccess('');
        setMode('password');
      }, 4000);
    } else {
      setError('E-mail mestre incorreto.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-900 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-700 border border-transparent dark:border-slate-800 transition-colors">
        <div className="p-8 sm:p-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
            <Music size={36} className="text-emerald-700 dark:text-emerald-400 -rotate-3" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
            Minist. de Louvor Pibje
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 uppercase text-[10px] tracking-[0.2em]">
            Gestão Ministerial
          </p>

          {/* MODO: SELEÇÃO PRINCIPAL (INTEGRANTE OU ADMIN) */}
          {mode === 'selection' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <button 
                onClick={() => setMode('member-select')}
                className="w-full group bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/60 hover:border-emerald-200 dark:hover:border-emerald-600/50 p-5 sm:p-6 rounded-3xl flex items-center gap-4 transition-all text-left cursor-pointer"
              >
                <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl shadow-sm text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                  <Users size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-slate-800 dark:text-white text-base">Acesso Integrantes</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 truncate">Selecione seu nome e acesse suas escalas</p>
                </div>
                <ChevronRight className="ml-auto text-slate-300 dark:text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-600 transition-transform shrink-0" />
              </button>

              <button 
                onClick={() => setMode('password')}
                className="w-full group bg-emerald-600 hover:bg-emerald-700 p-5 sm:p-6 rounded-3xl flex items-center gap-4 transition-all shadow-xl shadow-emerald-900/20 text-white text-left cursor-pointer"
              >
                <div className="bg-white/20 p-3 rounded-2xl text-white group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-white text-base">Administrador</p>
                  <p className="text-xs text-emerald-100 truncate">Gestão completa, edições e escalas</p>
                </div>
                <ChevronRight className="ml-auto text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          )}

          {/* MODO: SELEÇÃO DO INTEGRANTE ATIVO */}
          {mode === 'member-select' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 text-left">
              <div className="mb-2">
                <button 
                  type="button"
                  onClick={() => { setMode('selection'); setSearchTerm(''); }}
                  className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft size={13} /> Voltar
                </button>
              </div>

              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar seu nome..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-2xl py-3 pl-10 pr-9 outline-none focus:border-emerald-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Lista com Rolagem dos Integrantes Ativos */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => {
                    const isLast = m.id === lastMemberId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className={`w-full group p-3 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                          isLast
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/80'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:bg-emerald-50/60 dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.name}
                              className="w-10 h-10 rounded-2xl object-cover border border-emerald-200 dark:border-emerald-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isLast && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-slate-800 dark:text-white text-sm truncate">
                              {m.name}
                            </p>
                            {isLast && (
                              <span className="text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                Recente
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                            {m.roles && m.roles.length > 0 ? m.roles.join(' • ') : 'Integrante'}
                          </p>
                        </div>

                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all shrink-0" />
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <User size={30} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Nenhum integrante ativo encontrado</p>
                    {searchTerm && (
                      <p className="text-[10px] text-slate-400 mt-1">Tente buscar por outro termo</p>
                    )}
                  </div>
                )}
              </div>

              {/* Opção alternativa sem identificação */}
              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onLogin('member')}
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Entrar sem selecionar nome
                </button>
              </div>
            </div>
          )}

          {/* MODO: SENHA ADMIN */}
          {mode === 'password' && (
            <form onSubmit={handleAdminLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-left">
                <button 
                  type="button"
                  onClick={() => setMode('selection')}
                  className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft size={13} /> Voltar
                </button>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Senha de Acesso (4 dígitos)</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-xl tracking-[0.5em] transition-all"
                  />
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2 animate-bounce">{error}</p>}
                {success && <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2 ml-2">{success}</p>}
              </div>

              <button 
                type="submit"
                disabled={password.length < 4}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer"
              >
                ENTRAR NO SISTEMA
              </button>
              
              <button 
                type="button"
                onClick={() => setMode('recovery')}
                className="block mx-auto text-[10px] font-bold text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Esqueci a senha
              </button>
            </form>
          )}

          {/* MODO: RECUPERAÇÃO DE SENHA */}
          {mode === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-left">
                <button 
                  type="button"
                  onClick={() => setMode('password')}
                  className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft size={13} /> Voltar
                </button>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Recuperar Acesso</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Insira o e-mail mestre para resetar a senha para o padrão.</p>
                
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">E-mail Mestre</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    autoFocus
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 rounded-2xl py-4 pl-14 pr-6 outline-none font-bold transition-all"
                  />
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2 animate-bounce">{error}</p>}
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={18} /> RESETAR SENHA
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 uppercase tracking-widest">
            Criado por Matheus Peres
          </p>
        </div>
      </div>
    </div>
  );
};
