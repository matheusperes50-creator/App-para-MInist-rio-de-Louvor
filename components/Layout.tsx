import React, { useState, useEffect, useRef } from 'react';
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
  GripVertical,
  RotateCcw,
  LucideIcon
} from 'lucide-react';

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

const STORAGE_NAV_ORDER_KEY = 'louvor_nav_order';

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passStatus, setPassStatus] = useState<'idle' | 'success'>('idle');

  const isAdmin = userRole === 'admin';

  // State to hold custom order of tab IDs
  const [navOrder, setNavOrder] = useState<ViewType[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NAV_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify that all IDs exist
          const validIds = new Set(DEFAULT_NAV_ITEMS.map(i => i.id));
          const filtered = parsed.filter(id => validIds.has(id));
          // Append any missing items
          DEFAULT_NAV_ITEMS.forEach(i => {
            if (!filtered.includes(i.id)) filtered.push(i.id);
          });
          return filtered;
        }
      }
    } catch {}
    return DEFAULT_NAV_ITEMS.map(i => i.id);
  });

  // Dragging state
  const [draggedId, setDraggedId] = useState<ViewType | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [dragOverId, setDragOverId] = useState<ViewType | null>(null);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef<boolean>(false);

  // Compute sorted items based on current order and permissions
  const sortedNavItems = React.useMemo(() => {
    const itemMap = new Map<ViewType, NavItemDef>();
    DEFAULT_NAV_ITEMS.forEach(item => itemMap.set(item.id, item));

    const ordered: NavItemDef[] = [];
    navOrder.forEach(id => {
      const item = itemMap.get(id);
      if (item && (!item.adminOnly || isAdmin)) {
        ordered.push(item);
      }
    });

    // Add any items not yet in ordered (e.g. newly added)
    DEFAULT_NAV_ITEMS.forEach(item => {
      if ((!item.adminOnly || isAdmin) && !ordered.some(o => o.id === item.id)) {
        ordered.push(item);
      }
    });

    return ordered;
  }, [navOrder, isAdmin]);

  const saveOrder = (newOrder: ViewType[]) => {
    setNavOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_NAV_ORDER_KEY, JSON.stringify(newOrder));
    } catch {}
  };

  const handleResetOrder = () => {
    const defaultIds = DEFAULT_NAV_ITEMS.map(i => i.id);
    saveOrder(defaultIds);
    try {
      localStorage.removeItem(STORAGE_NAV_ORDER_KEY);
    } catch {}
  };

  const isCustomOrder = React.useMemo(() => {
    const defaultIds = DEFAULT_NAV_ITEMS.map(i => i.id);
    return JSON.stringify(navOrder) !== JSON.stringify(defaultIds);
  }, [navOrder]);

  const handleNavClick = (view: ViewType) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
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

  // Drag and drop / Press and hold logic
  const reorderItems = (sourceId: ViewType, targetId: ViewType) => {
    if (sourceId === targetId) return;
    const currentList = [...navOrder];
    const sourceIndex = currentList.indexOf(sourceId);
    const targetIndex = currentList.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, sourceId);
    saveOrder(currentList);
  };

  // Pointer down (mouse or touch)
  const handlePointerDown = (e: React.PointerEvent, id: ViewType) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    // Start press and hold timer (200ms)
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(true);
      setDraggedId(id);
      didDragRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;

    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);

    // If moving significantly before 200ms hold, cancel hold (user is scrolling)
    if (!isHolding && (dx > 10 || dy > 10)) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      return;
    }

    if (isHolding && draggedId) {
      // Find element underneath the finger / pointer
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const targetNavElem = elem?.closest('[data-nav-id]') as HTMLElement | null;
      if (targetNavElem) {
        const targetId = targetNavElem.dataset.navId as ViewType;
        if (targetId && targetId !== draggedId) {
          setDragOverId(targetId);
          reorderItems(draggedId, targetId);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    startPosRef.current = null;
    setIsHolding(false);
    setDraggedId(null);
    setDragOverId(null);

    // Reset didDrag flag after a brief tick to prevent click event
    if (didDragRef.current) {
      setTimeout(() => {
        didDragRef.current = false;
      }, 50);
    }
  };

  // HTML5 Drag support for desktop
  const handleDragStart = (e: React.DragEvent, id: ViewType) => {
    setDraggedId(id);
    setIsHolding(true);
    didDragRef.current = true;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: ViewType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: ViewType) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      reorderItems(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
    setIsHolding(false);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setIsHolding(false);
    setTimeout(() => {
      didDragRef.current = false;
    }, 50);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden select-none">
      <header className="md:hidden bg-emerald-700 text-white p-4 flex justify-between items-center z-50 shadow-md h-16 shrink-0">
        <div className="flex flex-col">
          <h1 className="font-black text-base tracking-tight leading-none uppercase">Minist. Louvor Pibje</h1>
          <p className="text-[7px] text-emerald-200 font-bold uppercase tracking-tighter mt-0.5">Gestão Ministerial</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 active:bg-emerald-600 rounded-lg transition-colors"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className={`
        fixed inset-y-0 left-0 z-[70] bg-emerald-900 text-slate-100 transition-transform duration-300 ease-out md:relative md:translate-x-0 md:w-64 md:flex-shrink-0
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

          {/* Restaurar ordem se personalizada */}
          {isCustomOrder && (
            <div className="flex items-center justify-end mb-2 px-1">
              <button
                onClick={handleResetOrder}
                className="text-[9px] font-black uppercase tracking-widest text-emerald-300 hover:text-white flex items-center gap-1 transition-colors py-1 px-2 rounded-lg bg-emerald-800/40 hover:bg-emerald-800"
                title="Restaurar ordem original das abas"
              >
                <RotateCcw size={10} /> Resetar Ordem
              </button>
            </div>
          )}

          <div 
            className="space-y-1 md:space-y-1.5 overflow-y-auto flex-1 no-scrollbar touch-pan-y"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {sortedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isBeingDragged = draggedId === item.id;
              const isDropTarget = dragOverId === item.id && !isBeingDragged;

              return (
                <div
                  key={item.id}
                  data-nav-id={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onPointerDown={(e) => handlePointerDown(e, item.id)}
                  className={`
                    relative rounded-xl transition-all duration-150 select-none
                    ${isBeingDragged ? 'scale-[1.03] z-50 ring-2 ring-emerald-300 shadow-2xl bg-emerald-700 opacity-95' : ''}
                    ${isDropTarget ? 'border-t-2 border-emerald-300 pt-1' : ''}
                  `}
                >
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl font-bold transition-all text-left
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20' 
                        : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'}
                      ${isBeingDragged ? 'cursor-grabbing' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Icon size={19} className={`shrink-0 ${isActive ? 'scale-110 text-white' : 'text-emerald-300'}`} />
                      <span className="tracking-tight text-sm font-bold truncate">{item.label}</span>
                    </div>

                    <div 
                      className="text-emerald-400/50 hover:text-white transition-opacity p-0.5 cursor-grab active:cursor-grabbing shrink-0" 
                      title="Segure e arraste para reordenar"
                    >
                      <GripVertical size={14} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-emerald-800 shrink-0">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2.5">Sessão Atual</p>
            <div className="flex items-center gap-3 bg-emerald-800/50 p-3 rounded-2xl border border-emerald-700">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${isAdmin ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                {isAdmin ? <ShieldCheck size={20} /> : <User size={20} />}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-black truncate">{isAdmin ? 'Administrador' : 'Membro'}</p>
                <button 
                  onClick={() => isAdmin && setShowPasswordModal(true)}
                  className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest truncate hover:text-white transition-colors flex items-center gap-1"
                >
                  {isAdmin ? <><Key size={10} /> Trocar Senha</> : 'Acesso Visualização'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto bg-slate-50 relative select-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">Nova Senha</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Defina um novo código de 4 dígitos para o acesso administrativo.</p>
            
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
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl py-4 px-6 outline-none font-bold text-xl tracking-[0.5em] text-center"
                />
              </div>

              {passStatus === 'success' ? (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs">
                  <Check size={18} /> SENHA ALTERADA!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleChangePassword}
                    disabled={newPass.length < 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                  >
                    CONFIRMAR
                  </button>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-2"
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