import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import * as storage from '../storage.js';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [subscriptions, setSubscriptions] = useState(() => storage.reconcileNextPaymentDates());

  const refresh = useCallback(() => {
    setSubscriptions(storage.getAllSubscriptions());
  }, []);

  const addSubscription = useCallback((fields) => {
    const created = storage.addSubscription(fields);
    refresh();
    return created;
  }, [refresh]);

  const updateSubscription = useCallback((id, patch) => {
    const updated = storage.updateSubscription(id, patch);
    refresh();
    return updated;
  }, [refresh]);

  const deleteSubscription = useCallback((id) => {
    const result = storage.deleteSubscription(id);
    refresh();
    return result;
  }, [refresh]);

  const cancelSubscription = useCallback((id) => {
    const updated = storage.cancelSubscription(id);
    refresh();
    return updated;
  }, [refresh]);

  const restoreSubscription = useCallback((id) => {
    const updated = storage.restoreSubscription(id);
    refresh();
    return updated;
  }, [refresh]);

  const pauseSubscription = useCallback((id) => {
    const updated = storage.pauseSubscription(id);
    refresh();
    return updated;
  }, [refresh]);

  const resumeSubscription = useCallback((id) => {
    const updated = storage.resumeSubscription(id);
    refresh();
    return updated;
  }, [refresh]);

  const importData = useCallback((json) => {
    const result = storage.importData(json);
    refresh();
    return result;
  }, [refresh]);

  const importCsv = useCallback((csvText) => {
    const result = storage.importCsv(csvText);
    refresh();
    return result;
  }, [refresh]);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === 'active'),
    [subscriptions],
  );

  const cancelledSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === 'cancelled'),
    [subscriptions],
  );

  const pausedSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === 'paused'),
    [subscriptions],
  );

  const getById = useCallback(
    (id) => subscriptions.find((s) => s.id === id) ?? null,
    [subscriptions],
  );

  const value = {
    subscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    pausedSubscriptions,
    getById,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    restoreSubscription,
    pauseSubscription,
    resumeSubscription,
    exportData: storage.exportData,
    importData,
    importCsv,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData должен использоваться внутри AppDataProvider');
  return ctx;
}
