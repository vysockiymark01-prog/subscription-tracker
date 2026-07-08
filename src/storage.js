// Единственная точка доступа к данным приложения.
// Сейчас поверх localStorage, при переходе на IndexedDB меняется только этот файл.

import { advanceOverdueDate, todayISO } from './utils/dates.js';
import { parseSubscriptionsCsv } from './utils/csv.js';

const STORAGE_KEY = 'subscriptions';

export const CATEGORIES = ['video', 'music', 'software', 'games', 'education', 'other'];

export const PERIODS = ['week', 'month', 'quarter', 'year'];

export const REMINDER_OPTIONS = [1, 3, 7];

function readAll() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(subscriptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Создаёт объект подписки со значениями по умолчанию, дополненный переданными полями.
 */
export function createSubscription(fields) {
  const subscription = {
    id: generateId(),
    name: '',
    price: 0,
    currency: 'RUB',
    period: 'month',
    nextPaymentDate: todayISO(),
    category: 'other',
    isTrial: false,
    trialEndDate: null,
    status: 'active',
    cancelledAt: null,
    pausedAt: null,
    reminderDays: 3,
    iconKey: null,
    splitCount: 1,
    priceHistory: [],
    ...fields,
  };
  // Первая запись истории фиксирует цену на момент добавления подписки.
  if (subscription.priceHistory.length === 0) {
    subscription.priceHistory = [{ date: todayISO(), price: subscription.price }];
  }
  return subscription;
}

export function getAllSubscriptions() {
  return readAll();
}

/**
 * Сдвигает nextPaymentDate вперёд для всех активных подписок, у которых
 * дата списания уже в прошлом (приложение не открывали дольше периода).
 * Вызывается один раз при открытии приложения.
 */
export function reconcileNextPaymentDates() {
  const all = readAll();
  let changed = false;
  const updated = all.map((s) => {
    if (s.status !== 'active') return s;
    const nextDate = advanceOverdueDate(s.nextPaymentDate, s.period);
    if (nextDate === s.nextPaymentDate) return s;
    changed = true;
    return { ...s, nextPaymentDate: nextDate };
  });
  if (changed) writeAll(updated);
  return updated;
}

export function getActiveSubscriptions() {
  return readAll().filter((s) => s.status === 'active');
}

export function getCancelledSubscriptions() {
  return readAll().filter((s) => s.status === 'cancelled');
}

export function getPausedSubscriptions() {
  return readAll().filter((s) => s.status === 'paused');
}

export function getSubscriptionById(id) {
  return readAll().find((s) => s.id === id) ?? null;
}

export function addSubscription(fields) {
  const subscription = createSubscription(fields);
  const all = readAll();
  all.push(subscription);
  writeAll(all);
  return subscription;
}

export function updateSubscription(id, patch) {
  const all = readAll();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const current = all[index];

  let priceHistory = current.priceHistory ?? [];
  if (patch.price !== undefined && patch.price !== current.price) {
    priceHistory = [...priceHistory, { date: todayISO(), price: patch.price }];
  }

  const updated = { ...current, ...patch, id, priceHistory };
  all[index] = updated;
  writeAll(all);
  return updated;
}

export function deleteSubscription(id) {
  const all = readAll();
  const filtered = all.filter((s) => s.id !== id);
  writeAll(filtered);
  return filtered.length !== all.length;
}

export function cancelSubscription(id) {
  return updateSubscription(id, {
    status: 'cancelled',
    cancelledAt: todayISO(),
  });
}

export function restoreSubscription(id) {
  return updateSubscription(id, {
    status: 'active',
    cancelledAt: null,
  });
}

export function pauseSubscription(id) {
  return updateSubscription(id, {
    status: 'paused',
    pausedAt: todayISO(),
  });
}

export function resumeSubscription(id) {
  return updateSubscription(id, {
    status: 'active',
    pausedAt: null,
  });
}

export function exportData() {
  return JSON.stringify(readAll(), null, 2);
}

export function importData(json) {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('Некорректный формат файла: ожидался массив подписок');
  }
  writeAll(parsed);
  return parsed;
}

/**
 * Импортирует подписки из CSV (name,price,period,category,nextPaymentDate) и
 * добавляет их к уже существующим — в отличие от importData не перезаписывает список.
 */
export function importCsv(csvText) {
  const rows = parseSubscriptionsCsv(csvText);
  if (rows.length === 0) {
    throw new Error('Не удалось распознать ни одной подписки в CSV-файле');
  }

  const all = readAll();
  const created = rows.map((fields) => {
    const subscription = createSubscription({
      ...fields,
      category: CATEGORIES.includes(fields.category) ? fields.category : 'other',
      period: PERIODS.includes(fields.period) ? fields.period : 'month',
    });
    all.push(subscription);
    return subscription;
  });
  writeAll(all);
  return created;
}

const THEME_KEY = 'theme-preference';

export function getThemePreference() {
  try {
    return localStorage.getItem(THEME_KEY) ?? 'system';
  } catch {
    return 'system';
  }
}

export function setThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
