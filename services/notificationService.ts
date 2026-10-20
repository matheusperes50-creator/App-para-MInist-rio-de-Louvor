import { Schedule, Member, AppNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'louvor_inapp_notifications';
const PUSH_ENABLED_KEY = 'louvor_push_notifications_enabled';
const NOTIFIED_SCHEDULES_KEY = 'louvor_notified_schedule_ids';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

// Check if browser supports Web Notifications
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Check current permission
export const getNotificationPermission = (): NotificationPermissionState => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
};

// Check if user has explicitly enabled push in app settings
export const isPushEnabledInApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(PUSH_ENABLED_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
};

export const setPushEnabledInApp = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {}
};

// Request system notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    if (isGranted) {
      setPushEnabledInApp(true);
    }
    return isGranted;
  } catch (err) {
    console.warn('Erro ao solicitar permissão de notificações:', err);
    return false;
  }
};

// Format schedule date nicely (e.g., "25/10/2026" or "25/10")
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    // If YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Get stored in-app notifications
export const getInAppNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const list: AppNotification[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

// Save a new notification to in-app log and dispatch UI event
export const saveInAppNotification = (notif: AppNotification): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getInAppNotifications();
    // Keep max 40 notifications
    const updated = [notif, ...current.filter(n => n.id !== notif.id)].slice(0, 40);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time unread badges in UI
    window.dispatchEvent(new CustomEvent('louvor:notifications-changed', { detail: { newNotification: notif } }));
  } catch (err) {
    console.warn('Erro ao salvar notificação:', err);
  }
};

// Mark single notification as read
export const markNotificationAsRead = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getInAppNotifications();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('louvor:notifications-changed'));
  } catch {}
};

// Mark all notifications as read
export const markAllNotificationsAsRead = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getInAppNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('louvor:notifications-changed'));
  } catch {}
};

// Clear all notifications
export const clearAllNotifications = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('louvor:notifications-changed'));
  } catch {}
};

// Low-level trigger for system push notification (Service Worker or Notification API)
export const showSystemNotification = async (
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    vibrate?: number[];
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions: NotificationOptions = {
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/apple-touch-icon.png',
    body: options.body,
    tag: options.tag || `pibje-${Date.now()}`,
    data: options.data || { url: '/' },
    // Vibration pattern for mobile devices (haptic buzz)
    vibrate: options.vibrate || [200, 100, 200]
  } as any;

  try {
    // 1. Prefer Service Worker registration for persistent OS notifications (works when app is in background)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, defaultOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Falha via Service Worker showNotification, usando fallback:', swErr);
      }
    }

    // 2. Fallback to standard Window Notification
    const notif = new Notification(title, defaultOptions);
    notif.onclick = () => {
      window.focus();
      if (options.data?.scheduleId) {
        window.dispatchEvent(new CustomEvent('louvor:navigate-schedule', { detail: { scheduleId: options.data.scheduleId } }));
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Erro ao emitir notificação de sistema:', err);
    return false;
  }
};

// Send notification when a new schedule is created or published
export const notifyNewSchedulePublished = async (
  schedule: Schedule,
  members: Member[] = [],
  options?: { isUpdate?: boolean; loggedMemberName?: string }
): Promise<void> => {
  const isUpdate = options?.isUpdate || false;
  const formattedDate = formatDisplayDate(schedule.date);
  const serviceType = schedule.serviceType || 'Culto de Louvor';

  // Find participants
  const assignedMemberNames: string[] = [];
  (schedule.assignments || []).forEach(a => {
    const mem = members.find(m => m.id === a.memberId);
    if (mem && !assignedMemberNames.includes(mem.name)) {
      assignedMemberNames.push(mem.name);
    }
  });

  const title = isUpdate 
    ? `🔔 Escala Atualizada (${formattedDate})` 
    : `📢 Nova Escala Publicada! (${formattedDate})`;

  let body = `${serviceType}: Confira a equipe escalada e o repertório de músicas no app.`;

  // If a member is logged in, check if they are in this schedule to personalize
  if (options?.loggedMemberName) {
    const loggedName = options.loggedMemberName.toLowerCase();
    const assignment = (schedule.assignments || []).find(a => {
      const m = members.find(mem => mem.id === a.memberId);
      return m && m.name.toLowerCase().includes(loggedName);
    });

    if (assignment) {
      body = `Você está escalado(a) como ${assignment.role} para ${formattedDate} (${serviceType})! Toque para ver detalhes e repertório.`;
    }
  } else if (assignedMemberNames.length > 0) {
    const previewNames = assignedMemberNames.slice(0, 3).join(', ');
    const more = assignedMemberNames.length > 3 ? ` e +${assignedMemberNames.length - 3}` : '';
    body = `${serviceType} • Equipe: ${previewNames}${more}. Toque para ver o setlist completo.`;
  }

  // 1. Always record into In-App Notification Center
  const inAppNotif: AppNotification = {
    id: `notif_${schedule.id}_${Date.now()}`,
    title,
    body,
    date: new Date().toISOString(),
    scheduleId: schedule.id,
    read: false,
    type: isUpdate ? 'schedule_updated' : 'schedule_published'
  };
  saveInAppNotification(inAppNotif);

  // 2. Try sending native push notification if permitted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    await showSystemNotification(title, {
      body,
      tag: `schedule-${schedule.id}`,
      data: { scheduleId: schedule.id, url: `/?view=schedules&id=${schedule.id}` },
      vibrate: [250, 100, 250, 100, 250]
    });
  }

  // Record that this schedule has been notified to avoid spamming
  try {
    const raw = localStorage.getItem(NOTIFIED_SCHEDULES_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add(schedule.id);
    localStorage.setItem(NOTIFIED_SCHEDULES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

// Check for unnotified schedules (e.g. after cloud fetch) and alert member
export const checkAndNotifyUnseenSchedules = async (
  schedules: Schedule[],
  members: Member[] = [],
  loggedMemberName?: string
): Promise<number> => {
  if (!schedules || schedules.length === 0) return 0;
  if (typeof window === 'undefined') return 0;

  try {
    const raw = localStorage.getItem(NOTIFIED_SCHEDULES_KEY);
    const notifiedIds = new Set<string>(raw ? JSON.parse(raw) : []);

    // Find new schedules that haven't been notified yet
    const unnotified = schedules.filter(s => s && s.id && !notifiedIds.has(s.id));

    if (unnotified.length > 0) {
      // Notify about the most recent one or summarize
      if (unnotified.length === 1) {
        await notifyNewSchedulePublished(unnotified[0], members, { loggedMemberName });
      } else {
        const title = `📢 ${unnotified.length} Novas Escalas Publicadas!`;
        const body = `Novas escalas de louvor foram sincronizadas e estão disponíveis para consulta no aplicativo.`;
        
        const inAppNotif: AppNotification = {
          id: `notif_batch_${Date.now()}`,
          title,
          body,
          date: new Date().toISOString(),
          read: false,
          type: 'schedule_published'
        };
        saveInAppNotification(inAppNotif);

        if (isNotificationSupported() && Notification.permission === 'granted') {
          await showSystemNotification(title, {
            body,
            tag: `batch-${Date.now()}`,
            data: { url: '/?view=schedules' },
            vibrate: [200, 100, 200]
          });
        }

        // Mark all as notified
        unnotified.forEach(s => notifiedIds.add(s.id));
        localStorage.setItem(NOTIFIED_SCHEDULES_KEY, JSON.stringify(Array.from(notifiedIds)));
      }
      return unnotified.length;
    }
  } catch (err) {
    console.warn('Erro ao verificar escalas não notificadas:', err);
  }

  return 0;
};

// Send an instant test push notification
export const sendTestPushNotification = async (): Promise<boolean> => {
  const title = 'PIBJE Louvor - Teste de Notificação 🎵';
  const body = 'Notificações push ativadas com sucesso! Você receberá alertas sempre que uma nova escala for publicada.';

  const inAppNotif: AppNotification = {
    id: `test_${Date.now()}`,
    title,
    body,
    date: new Date().toISOString(),
    read: false,
    type: 'test'
  };
  saveInAppNotification(inAppNotif);

  if (isNotificationSupported()) {
    if (Notification.permission === 'granted') {
      return await showSystemNotification(title, {
        body,
        tag: `test-${Date.now()}`,
        vibrate: [150, 80, 150]
      });
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        return await showSystemNotification(title, {
          body,
          tag: `test-${Date.now()}`,
          vibrate: [150, 80, 150]
        });
      }
    }
  }

  return false;
};
