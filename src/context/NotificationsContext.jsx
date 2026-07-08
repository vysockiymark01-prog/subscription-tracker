import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as notifications from '../notifications.js';
import { useAppData } from './AppDataContext.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { activeSubscriptions } = useAppData();
  const [permission, setPermission] = useState(() => notifications.getPermission());
  const [showPrimer, setShowPrimer] = useState(false);
  const checkedOnce = useRef(false);

  useEffect(() => {
    if (checkedOnce.current) return;
    checkedOnce.current = true;
    notifications.checkAndNotify(activeSubscriptions);
  }, [activeSubscriptions]);

  const requestPermission = useCallback(async () => {
    const result = await notifications.requestPermission();
    setPermission(result);
    setShowPrimer(false);
    return result;
  }, []);

  const dismissPrimer = useCallback(() => setShowPrimer(false), []);

  const notifyFirstSubscriptionAdded = useCallback(() => {
    if (notifications.getPermission() === 'default') {
      setShowPrimer(true);
    }
  }, []);

  const value = {
    permission,
    isSupported: notifications.isSupported(),
    showPrimer,
    requestPermission,
    dismissPrimer,
    notifyFirstSubscriptionAdded,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications должен использоваться внутри NotificationsProvider');
  return ctx;
}
