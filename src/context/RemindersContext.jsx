import { createContext, useContext, useState, useCallback } from 'react';
import * as storage from '../storage.js';

const RemindersContext = createContext(null);

export function RemindersProvider({ children }) {
  const [reminders, setReminders] = useState(() => storage.getAllReminders());

  const refresh = useCallback(() => {
    setReminders(storage.getAllReminders());
  }, []);

  const addReminder = useCallback((fields) => {
    const created = storage.addReminder(fields);
    refresh();
    return created;
  }, [refresh]);

  const updateReminder = useCallback((id, patch) => {
    const updated = storage.updateReminder(id, patch);
    refresh();
    return updated;
  }, [refresh]);

  const deleteReminder = useCallback((id) => {
    const result = storage.deleteReminder(id);
    refresh();
    return result;
  }, [refresh]);

  const getById = useCallback(
    (id) => reminders.find((r) => r.id === id) ?? null,
    [reminders],
  );

  const value = {
    reminders,
    getById,
    addReminder,
    updateReminder,
    deleteReminder,
  };

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders должен использоваться внутри RemindersProvider');
  return ctx;
}
