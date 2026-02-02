
import React, { useState, useEffect } from 'react';
import { UserRoleType } from '../types';
import { ShieldCheck, Users, Lock, ChevronRight, Music, Heart, Mail, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRoleType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'selection' | 'password' | 'recovery'>('selection');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial password in localStorage if not exists
  useEffect(() => {
    if (!localStorage.getItem('louvor_admin_password')) {
      localStorage.setItem('louvor_admin_password', '1234');
    }
  }, []);

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
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Music size={40} className="text-emerald-700 -rotate-3" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">Minist. de Louvor Pibje</h1>
          <p className="text-slate-500 font-medium mb-10 uppercase text-[10px] tracking-[0.2em]">Gestão Ministerial</p>

          {mode === 'selection' && (
            <div className="space-y-4">
              <button 
                onClick={() => onLogin('member')}
                className="w-full group bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 p-6 rounded-3xl flex items-center gap-4 transition-all"
              >
                <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-800">Acesso Membro</p>
                  <p className="text-xs text-slate-400">Apenas visualização de escalas</p>
                </div>
                <ChevronRight className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setMode('password')}
                className="w-full group bg-emerald-600 hover:bg-emerald-700 p-6 rounded-3xl flex items-center gap-4 transition-all shadow-xl shadow-emerald-900/20"
              >
                <div className="bg-white/20 p-3 rounded-2xl text-white group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <p className="font-black text-white">Administrador</p>
                  <p className="text-xs text-emerald-100">Gestão completa e edições</p>
                </div>
                <ChevronRight className="ml-auto text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {mode === 'password' && (
            <form onSubmit={handleAdminLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-left">
                <button 
                  type="button"
                  onClick={() => setMode('selection')}
                  className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline"
                >
                  Voltar
                </button>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Senha de Acesso (4 dígitos)</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-xl tracking-[0.5em] transition-all"
                  />
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2 animate-bounce">{error}</p>}
                {success && <p className="text-emerald-600 text-[10px] font-bold mt-2 ml-2">{success}</p>}
              </div>

              <button 
                type="submit"
                disabled={password.length < 4}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
              >
                ENTRAR NO SISTEMA
              </button>
              
              <button 
                type="button"
                onClick={() => setMode('recovery')}
                className="block mx-auto text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors"
              >
                Esqueci a senha
              </button>
            </form>
          )}

          {mode === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-left">
                <button 
                  type="button"
                  onClick={() => setMode('password')}
                  className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1 hover:underline"
                >
                  Voltar
                </button>
                <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-tight">Recuperar Acesso</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Insira o e-mail mestre para resetar a senha para o padrão.</p>
                
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">E-mail Mestre</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    autoFocus
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl py-4 pl-14 pr-6 outline-none font-bold transition-all"
                  />
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2 animate-bounce">{error}</p>}
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> RESETAR SENHA
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[8px] font-bold text-slate-400 flex items-center justify-center gap-1 uppercase tracking-widest">
            Criado por Matheus Peres
          </p>
        </div>
      </div>
    </div>
  );
};
