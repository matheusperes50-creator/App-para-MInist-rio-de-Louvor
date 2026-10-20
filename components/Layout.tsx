import React, { useState } from 'react';
import { ViewType, UserRoleType } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  CalendarDays, 
  Menu, 
  X,
  ShieldCheck,
  User,
  Key,
  Check,
  Sparkles,
  BarChart3,
  Calendar,
  Shirt,
  Wand2,
  StickyNote,
  CalendarCheck,
  Settings,
  Sun,
  Moon,
  LucideIcon
} from 'lucide-react';
import { useTheme } from '../themeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  setView: (view: ViewType) => void;
  userRole: UserRoleType;
}

interface NavItemDef {
  id: ViewType;
  label: string;
  icon: LucideIcon;
  adminOnly: boolean;
}

const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { id: 'attendance', label: 'Presença', icon: CalendarCheck, adminOnly: false },
  { id: 'schedules', label: 'Escalas', icon: CalendarDays, adminOnly: false },
  { id: 'songs', label: 'Músicas', icon: Music, adminOnly: false },
  { id: 'members', label: 'Membros', icon: Users, adminOnly: true },
  { id: 'new-songs', label: 'Músicas Novas', icon: Sparkles, adminOnly: false },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { id: 'events', label: 'Eventos', icon: Calendar, adminOnly: false },
  { id: 'notes', label: 'Anotações', icon: StickyNote, adminOnly: false },
  { id: 'style', label: 'Look/Style', icon: Shirt, adminOnly: false },
  { id: 'auto-schedules', label: 'Escala Automática', icon: Wand2, adminOnly: true },
  { id: 'settings', label: 'Configurações', icon: Settings, adminOnly: false },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passStatus, setPassStatus] = useState<'idle' | 'success'>('idle');

  const isAdmin = userRole === 'admin';

  const navItems = React.useMemo(() => {
    return DEFAULT_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const handleNavClick = (view: ViewType) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const handleChangePassword = () => {
    if (newPass.length === 4) {
      localStorage.setItem('louvor_admin_password', newPass);
      setPassStatus('success');
      setTimeout(() => {
        setPassStatus('idle');
        setShowPasswordModal(false);
        setNewPass('');
      }, 2000);
    }
  };

  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden select-none transition-colors duration-200">
      <header className="md:hidden bg-emerald-700 dark:bg-slate-900 dark:border-b dark:border-slate-800 text-white p-4 flex justify-between items-center z-50 shadow-md h-16 shrink-0 transition-colors">
        <div className="flex flex-col">
          <h1 className="font-black text-base tracking-tight leading-none uppercase">Minist. Louvor Pibje</h1>
          <p className="text-[7px] text-emerald-200 dark:text-emerald-400 font-bold uppercase tracking-tighter mt-0.5">Gestão Ministerial</p>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationCenter setView={setView} />
          <button 
            onClick={toggleTheme} 
            className="p-2 active:bg-emerald-600 dark:active:bg-slate-800 rounded-lg transition-colors text-emerald-100 dark:text-amber-300"
            aria-label={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Noturno"}
            title={isDark ? "Modo Claro" : "Modo Noturno (Tela Escura)"}
          >
            {isDark ? <Sun size={22} className="text-amber-300" /> : <Moon size={22} />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 active:bg-emerald-600 dark:active:bg-slate-800 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className={`
        fixed inset-y-0 left-0 z-[70] bg-emerald-900 dark:bg-slate-900 dark:border-r dark:border-slate-800 text-slate-100 transition-transform duration-300 ease-out md:relative md:translate-x-0 md:w-64 md:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="hidden md:block mb-6">
            <h1 className="text-xl font-black tracking-tight text-white leading-tight uppercase">
              Minist. Louvor Pibje
            </h1>
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">
              Gestão Ministerial
            </p>
          </div>

          <div className="space-y-1 md:space-y-1.5 overflow-y-auto flex-1 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition-all text-left cursor-pointer
                    ${isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20' 
                      : 'text-emerald-200 dark:text-slate-300 hover:bg-emerald-800 dark:hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={19} className={`shrink-0 ${isActive ? 'scale-110 text-white' : 'text-emerald-300 dark:text-emerald-400'}`} />
                  <span className="tracking-tight text-sm font-bold truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-3 border-t border-emerald-800 dark:border-slate-800 shrink-0 space-y-3">
            <div className="flex justify-center">
              <PWAInstallButton />
            </div>
            {/* Alternador de Modo Noturno no Menu */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-emerald-700/60 dark:border-slate-700 text-slate-200 transition-colors text-xs font-bold cursor-pointer"
              title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Noturno (Tela Escura)"}
            >
              <span className="flex items-center gap-2 text-[11px] font-bold">
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-emerald-300" />}
                {isDark ? 'Modo Noturno' : 'Modo Claro'}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md bg-emerald-700 dark:bg-slate-700 text-white">
                {isDark ? 'Escuro' : 'Claro'}
              </span>
            </button>

            <div>
              <p className="text-[10px] text-emerald-400 dark:text-slate-400 font-black uppercase tracking-widest mb-2">Sessão Atual</p>
              <div className="flex items-center gap-3 bg-emerald-800/50 dark:bg-slate-800/60 p-3 rounded-2xl border border-emerald-700 dark:border-slate-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${isAdmin ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                  {isAdmin ? <ShieldCheck size={20} /> : <User size={20} />}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-black truncate">{isAdmin ? 'Administrador' : 'Membro'}</p>
                  <button 
                    onClick={() => isAdmin && setShowPasswordModal(true)}
                    className="text-[9px] text-emerald-400 dark:text-emerald-300 font-bold uppercase tracking-widest truncate hover:text-white transition-colors flex items-center gap-1"
                  >
                    {isAdmin ? <><Key size={10} /> Trocar Senha</> : 'Acesso Visualização'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative select-auto transition-colors duration-200">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Nova Senha</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Defina um novo código de 4 dígitos para o acesso administrativo.</p>
            
            <div className="space-y-4">
              <div className="relative">
                <input 
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 rounded-2xl py-4 px-6 outline-none font-bold text-xl tracking-[0.5em] text-center"
                />
              </div>

              {passStatus === 'success' ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                  <Check size={18} /> SENHA ALTERADA!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleChangePassword}
                    disabled={newPass.length < 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                  >
                    CONFIRMAR
                  </button>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="w-full text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest py-2 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};