import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  X, 
  Sparkles, 
  CheckCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppNotification, ViewType } from '../types';
import { 
  getInAppNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestPushNotification,
  formatDisplayDate,
  NotificationPermissionState
} from '../services/notificationService';

interface NotificationCenterProps {
  onNavigateToSchedule?: (scheduleId?: string) => void;
  setView?: (view: ViewType) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  onNavigateToSchedule,
  setView 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInAppNotifications());
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync notifications on mount and whenever custom event fires
  useEffect(() => {
    const handleSync = () => {
      setNotifications(getInAppNotifications());
      setPermission(getNotificationPermission());
    };

    window.addEventListener('louvor:notifications-changed', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('louvor:notifications-changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    setIsRequesting(false);
    if (granted) {
      setTestStatus('✓ Notificações push ativadas com sucesso!');
      setTimeout(() => setTestStatus(null), 3500);
    } else {
      setTestStatus('Permissão não concedida pelo navegador.');
      setTimeout(() => setTestStatus(null), 3500);
    }
  };

  const handleTestNotification = async () => {
    setTestStatus('Enviando alerta de teste...');
    const ok = await sendTestPushNotification();
    setPermission(getNotificationPermission());
    if (ok) {
      setTestStatus('✓ Notificação de teste enviada!');
    } else {
      setTestStatus('Notificação gerada no app. Para push no sistema, permita no navegador.');
    }
    setTimeout(() => setTestStatus(null), 3500);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    setNotifications(getInAppNotifications());
    if (notif.scheduleId) {
      if (onNavigateToSchedule) {
        onNavigateToSchedule(notif.scheduleId);
      } else if (setView) {
        setView('schedules');
      }
    } else if (setView) {
      setView('schedules');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full border transition-all cursor-pointer ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
            : unreadCount > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
        title="Notificações de Escalas Publicadas"
        aria-label="Notificações"
      >
        {unreadCount > 0 ? (
          <BellRing size={16} className="animate-wiggle text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Bell size={16} />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer / Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <Bell size={16} />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-tight">
                  Notificações de Escalas
                </h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  {unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}` : 'Tudo atualizado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllNotificationsAsRead();
                    setNotifications(getInAppNotifications());
                  }}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Lidas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Browser Push Permission Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs">
            {permission === 'granted' ? (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Notificações Push no Celular/PC Ativadas
                </span>
                <button
                  onClick={handleTestNotification}
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Enviar notificação de teste"
                >
                  Testar
                </button>
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <span>Notificações bloqueadas no navegador. Para push, permita nas configurações do site.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  <Sparkles size={13} className="text-emerald-500 shrink-0" />
                  <span>Deseja receber avisos push quando novas escalas forem publicadas?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isRequesting ? 'Solicitando...' : 'Ativar Notificações Push'}
                  </button>
                  <button
                    onClick={handleTestNotification}
                    className="py-1.5 px-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    Testar
                  </button>
                </div>
              </div>
            )}

            {testStatus && (
              <p className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {testStatus}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Calendar size={18} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhuma notificação ainda</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Quando uma nova escala for publicada ou atualizada, o alerta aparecerá aqui.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                    !notif.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.read 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {notif.type === 'test' ? <Sparkles size={14} /> : <Calendar size={14} />}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`text-xs tracking-tight truncate ${
                        !notif.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'
                      }`}>
                        {notif.title}
                      </h5>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {notif.body}
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                      {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.date).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notif.id);
                      setNotifications(getInAppNotifications());
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-600 transition-opacity absolute right-2 top-3"
                    title="Marcar como lida"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  clearAllNotifications();
                  setNotifications([]);
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
              >
                <Trash2 size={12} /> Limpar Histórico
              </button>

              <button
                onClick={() => {
                  if (setView) setView('schedules');
                  setIsOpen(false);
                }}
                className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
              >
                Ver Todas as Escalas <ExternalLink size={11} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
