
import React from 'react';
import { ViewType } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  CalendarDays, 
  Menu, 
  X 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedules' as ViewType, label: 'Escalas', icon: CalendarDays },
    { id: 'songs' as ViewType, label: 'Músicas', icon: Music },
    { id: 'members' as ViewType, label: 'Membros', icon: Users },
  ];

  const handleNavClick = (view: ViewType) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <header className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-xl tracking-tight">LouvorManager</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <nav className={`
        fixed inset-0 z-40 bg-indigo-900 text-slate-100 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="hidden md:block mb-10">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-900">L</div>
              LouvorManager
            </h1>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-indigo-800">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-2">Igreja Local</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-xs">AD</div>
              <div>
                <p className="text-sm font-semibold">Administrador</p>
                <p className="text-xs text-indigo-400">Ministério de Louvor</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
