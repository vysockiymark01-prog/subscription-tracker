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
    customColor: null,
    emoji: null,
    note: '',
    splitCount: 1,
    oneTime: false,
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
 * Вызывается один раз при открытии приложения. Разовые подписки (oneTime) не
 * трогаем — они не продлеваются сами, пользователь отменяет их вручную.
 */
export function reconcileNextPaymentDates() {
  const all = readAll();
  let changed = false;
  const updated = all.map((s) => {
    if (s.status !== 'active' || s.oneTime) return s;
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

const DISPLAY_CURRENCY_KEY = 'display-currency-preference';

/**
 * 'grouped' — показывать итоги раздельно по валютам (поведение по умолчанию).
 * Код валюты (например 'USD') — конвертировать и показывать общий итог в ней
 * по курсу ЦБ РФ, если он доступен.
 */
export function getDisplayCurrencyPreference() {
  try {
    return localStorage.getItem(DISPLAY_CURRENCY_KEY) ?? 'grouped';
  } catch {
    return 'grouped';
  }
}

export function setDisplayCurrencyPreference(value) {
  localStorage.setItem(DISPLAY_CURRENCY_KEY, value);
}

const LANGUAGE_KEY = 'language-preference';

export function getLanguagePreference() {
  try {
    return localStorage.getItem(LANGUAGE_KEY) ?? 'ru';
  } catch {
    return 'ru';
  }
}

export function setLanguagePreference(value) {
  localStorage.setItem(LANGUAGE_KEY, value);
}

const BACKUP_REMINDER_KEY = 'backup-reminder-days'; // '0' — выключено, иначе число дней
const LAST_EXPORT_KEY = 'last-export-at';

export function getBackupReminderDays() {
  try {
    return Number(localStorage.getItem(BACKUP_REMINDER_KEY) ?? '0');
  } catch {
    return 0;
  }
}

export function setBackupReminderDays(days) {
  localStorage.setItem(BACKUP_REMINDER_KEY, String(days));
}

export function getLastExportAt() {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

export function setLastExportAt(isoString) {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, isoString);
  } catch {
    // не критично
  }
}

const DISMISSED_TIPS_KEY = 'dismissed-tip-ids';

export function getDismissedTipIds() {
  try {
    const raw = localStorage.getItem(DISMISSED_TIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDismissedTipIds(ids) {
  try {
    const current = getDismissedTipIds();
    const merged = [...new Set([...current, ...ids])];
    localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(merged));
  } catch {
    // не критично
  }
}

const LAST_BACKUP_NOTIF_KEY = 'last-backup-notif-at';

export function getLastBackupNotifAt() {
  try {
    return localStorage.getItem(LAST_BACKUP_NOTIF_KEY);
  } catch {
    return null;
  }
}

export function setLastBackupNotifAt(isoDate) {
  try {
    localStorage.setItem(LAST_BACKUP_NOTIF_KEY, isoDate);
  } catch {
    // не критично
  }
}

const APP_LOCK_KEY = 'app-lock-enabled';
const PIN_HASH_KEY = 'app-pin-hash';
const BIOMETRIC_KEY = 'app-lock-biometric';
const ONBOARDING_KEY = 'onboarding-completed';

export function isAppLockEnabled() {
  try {
    return localStorage.getItem(APP_LOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAppLockEnabled(enabled) {
  localStorage.setItem(APP_LOCK_KEY, enabled ? '1' : '0');
}

export function getPinHash() {
  try {
    return localStorage.getItem(PIN_HASH_KEY);
  } catch {
    return null;
  }
}

export function setPinHash(hash) {
  if (hash) localStorage.setItem(PIN_HASH_KEY, hash);
  else localStorage.removeItem(PIN_HASH_KEY);
}

export function isBiometricEnabled() {
  try {
    return localStorage.getItem(BIOMETRIC_KEY) === '1';
  } catch {
    return false;
  }
}

export function setBiometricEnabled(enabled) {
  localStorage.setItem(BIOMETRIC_KEY, enabled ? '1' : '0');
}

const BIOMETRIC_CREDENTIAL_KEY = 'app-lock-biometric-credential';

export function getBiometricCredentialId() {
  try {
    return localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  } catch {
    return null;
  }
}

export function setBiometricCredentialId(id) {
  if (id) localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, id);
  else localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
}

export function isOnboardingCompleted() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true;
  }
}

export function setOnboardingCompleted() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

const LAST_TAB_KEY = 'last-tab';
const VALID_TABS = ['home', 'stats', 'calendar', 'reminders', 'archive', 'settings'];

/**
 * Последняя открытая вкладка нижней навигации — чтобы обновление страницы
 * (F5, повторный запуск PWA) не перекидывало пользователя на главную.
 */
export function getLastTab() {
  try {
    const value = localStorage.getItem(LAST_TAB_KEY);
    return VALID_TABS.includes(value) ? value : 'home';
  } catch {
    return 'home';
  }
}

export function setLastTab(tab) {
  try {
    if (VALID_TABS.includes(tab)) localStorage.setItem(LAST_TAB_KEY, tab);
  } catch {
    // не критично
  }
}

/**
 * Массовое архивирование/удаление — для режима выбора нескольких подписок
 * на главном экране разом.
 */
export function cancelMany(ids) {
  const idSet = new Set(ids);
  const all = readAll();
  const updated = all.map((s) =>
    idSet.has(s.id) ? { ...s, status: 'cancelled', cancelledAt: todayISO() } : s,
  );
  writeAll(updated);
  return updated;
}

export function deleteMany(ids) {
  const idSet = new Set(ids);
  const all = readAll();
  const filtered = all.filter((s) => !idSet.has(s.id));
  writeAll(filtered);
  return filtered;
}

const CUSTOM_CATEGORIES_KEY = 'custom-categories';

/**
 * Свои категории — в дополнение к фиксированному списку CATEGORIES.
 * Хранятся как {id: 'custom:<uuid>', name}, id используется как значение
 * поля category у подписки, чтобы не пересекаться с ключами переводов.
 */
export function getCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addCustomCategory(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return null;
  const categories = getCustomCategories();
  const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;
  const category = { id: `custom:${generateId()}`, name: trimmed };
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify([...categories, category]));
  } catch {
    // не критично
  }
  return category;
}

export function deleteCustomCategory(id) {
  try {
    const updated = getCustomCategories().filter((c) => c.id !== id);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  } catch {
    // не критично
  }
}

/**
 * Название категории для отображения: встроенные переводим через t(),
 * свои — берём как есть из хранилища.
 */
export function getCategoryLabel(categoryId, t) {
  if (typeof categoryId === 'string' && categoryId.startsWith('custom:')) {
    const found = getCustomCategories().find((c) => c.id === categoryId);
    return found?.name ?? categoryId;
  }
  return t(`category.${categoryId}`);
}

// --- Напоминания (не подписки: без цены и валюты, просто "раз в N дней" от
// даты начала, с необязательной датой окончания). Отдельное хранилище. ---

const REMINDERS_KEY = 'reminders';

function readAllReminders() {
  let raw;
  try {
    raw = localStorage.getItem(REMINDERS_KEY);
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

function writeAllReminders(reminders) {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch {
    // не критично
  }
}

export function createReminder(fields) {
  return {
    id: generateId(),
    name: '',
    intervalDays: 7,
    startDate: todayISO(),
    endDate: null,
    reminderDays: 0, // 0 — напомнить в день события
    emoji: null,
    customColor: null,
    createdAt: todayISO(),
    ...fields,
  };
}

export function getAllReminders() {
  return readAllReminders();
}

export function getReminderById(id) {
  return readAllReminders().find((r) => r.id === id) ?? null;
}

export function addReminder(fields) {
  const reminder = createReminder(fields);
  const all = readAllReminders();
  all.push(reminder);
  writeAllReminders(all);
  return reminder;
}

export function updateReminder(id, patch) {
  const all = readAllReminders();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const updated = { ...all[index], ...patch, id };
  all[index] = updated;
  writeAllReminders(all);
  return updated;
}

export function deleteReminder(id) {
  const all = readAllReminders();
  const filtered = all.filter((r) => r.id !== id);
  writeAllReminders(filtered);
  return filtered.length !== all.length;
}
