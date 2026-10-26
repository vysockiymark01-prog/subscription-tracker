import { daysUntil, todayISO, addDays, addPeriod, formatShortDate } from './utils/dates.js';
import { formatMoney } from './utils/money.js';
import { LOCALES, DEFAULT_LOCALE, interpolate } from './i18n/index.js';
import * as storage from './storage.js';
import { shouldRemindBackup } from './utils/insights.js';
import { getNextOccurrence, getOccurrencesInRange } from './utils/reminderDates.js';

export function isSupported() {
  return typeof Notification !== 'undefined';
}

export function getPermission() {
  return isSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!isSupported()) return 'unsupported';
  return Notification.requestPermission();
}

function tFor(language) {
  const dict = LOCALES[language] ?? LOCALES[DEFAULT_LOCALE];
  return (key, vars) => interpolate(dict[key] ?? LOCALES[DEFAULT_LOCALE][key] ?? key, vars);
}

async function showNotification(title, options) {
  if (getPermission() !== 'granted') return;
  if (options?.tag) markShown(options.tag);
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // сервис-воркер недоступен — используем обычное уведомление ниже
    }
  }
  new Notification(title, options);
}

/**
 * Проверяет список активных подписок и показывает локальные уведомления
 * о приближающихся списаниях, окончании пробных периодов и — если пора —
 * напоминание сделать бэкап данных. Вызывается один раз при открытии приложения.
 */
export function checkAndNotify(subscriptions, language = 'ru', reminders = []) {
  if (getPermission() !== 'granted') return;
  const t = tFor(language);

  for (const r of reminders) {
    const next = getNextOccurrence(r);
    if (!next) continue;
    if ((r.completions ?? []).includes(next)) continue; // уже отмечено «Сделано»
    const daysToNext = daysUntil(next);
    if (daysToNext === (r.reminderDays ?? 0)) {
      showNotification(t('notif.reminderTitle'), {
        body: t('notif.reminderBody', { name: r.name }),
        tag: `reminder-${r.id}-${next}`,
      });
    }
  }

  for (const s of subscriptions) {
    if (s.status !== 'active') continue;

    const daysToPayment = daysUntil(s.nextPaymentDate);
    if (daysToPayment === s.reminderDays) {
      showNotification(t('notif.paymentTitle'), {
        body: t('notif.paymentBody', { name: s.name, amount: formatMoney(s.price, s.currency), days: daysToPayment }),
        tag: `payment-${s.id}-${s.nextPaymentDate}`,
      });
    }

    if (s.isTrial && s.trialEndDate) {
      const daysToTrialEnd = daysUntil(s.trialEndDate);
      if (daysToTrialEnd === s.reminderDays) {
        showNotification(t('notif.trialTitle'), {
          body: t('notif.trialBody', { name: s.name }),
          tag: `trial-${s.id}-${s.trialEndDate}`,
        });
      }
    }
  }

  const weekly = buildWeeklySummary(subscriptions, reminders, todayISO(), language);
  if (weekly && storage.isWeeklySummaryEnabled() && storage.getLastWeeklySummaryAt() !== todayISO()) {
    showNotification(weekly.title, { body: weekly.body, tag: weekly.tag });
    storage.setLastWeeklySummaryAt(todayISO());
  }

  const backupDue = shouldRemindBackup(storage.getBackupReminderDays(), storage.getLastExportAt());
  const today = todayISO();
  if (backupDue && storage.getLastBackupNotifAt() !== today) {
    showNotification(t('notif.backupTitle'), {
      body: t('notif.backupBody'),
      tag: `backup-${today}`,
    });
    storage.setLastBackupNotifAt(today);
  }
}

// --- Даты подписки в диапазоне (для сводки и фонового расписания) ---

function subscriptionDatesInRange(s, fromIso, toIso) {
  if (s.status !== 'active' || !s.nextPaymentDate) return [];
  if (s.oneTime) {
    const d = s.nextPaymentDate;
    return d >= fromIso && d <= toIso ? [d] : [];
  }
  const anchorDay = Number(s.nextPaymentDate.slice(-2));
  const dates = [];
  let current = s.nextPaymentDate;
  let guard = 0;
  while (current <= toIso && guard < 400) {
    if (current >= fromIso) dates.push(current);
    current = addPeriod(current, s.period, anchorDay);
    guard++;
  }
  return dates;
}

/**
 * Сводка на неделю — только по понедельникам: что спишется и какие дела
 * предстоят в ближайшие 7 дней. null, если не понедельник или неделя пустая.
 */
export function buildWeeklySummary(subscriptions, reminders, dayIso, language = 'ru') {
  const day = new Date(`${dayIso}T00:00:00`).getDay();
  if (day !== 1) return null;
  const t = tFor(language);
  const weekEnd = addDays(dayIso, 6);
  const lines = [];
  for (const s of subscriptions) {
    for (const d of subscriptionDatesInRange(s, dayIso, weekEnd)) {
      lines.push({ date: d, text: `${s.name} — ${formatMoney(s.price, s.currency)}, ${formatShortDate(d, language)}` });
    }
  }
  for (const r of reminders) {
    for (const d of getOccurrencesInRange(r, dayIso, weekEnd)) {
      lines.push({ date: d, text: `${r.name}, ${formatShortDate(d, language)}` });
    }
  }
  if (lines.length === 0) return null;
  lines.sort((a, b) => a.date.localeCompare(b.date));
  return {
    title: t('weekly.title'),
    body: lines.map((l) => l.text).join('\n'),
    tag: `weekly-${dayIso}`,
  };
}

/**
 * Расписание уведомлений на ближайшие дни — для фоновой проверки в service
 * worker (периодическая фоновая синхронизация Chrome). Service worker не видит
 * localStorage, поэтому страница заранее считает, что и когда показать, и
 * кладёт готовый список в Cache Storage, доступный обоим.
 */
export function buildSchedule(subscriptions, reminders, language = 'ru', days = 45) {
  const t = tFor(language);
  const today = todayISO();
  const horizon = addDays(today, days);
  const items = [];

  for (const s of subscriptions) {
    if (s.status !== 'active') continue;
    const lead = s.reminderDays ?? 3;
    for (const d of subscriptionDatesInRange(s, today, addDays(horizon, lead))) {
      const fire = addDays(d, -lead);
      if (fire < today || fire > horizon) continue;
      items.push({
        date: fire,
        title: t('notif.paymentTitle'),
        body: t('notif.paymentBody', { name: s.name, amount: formatMoney(s.price, s.currency), days: lead }),
        tag: `payment-${s.id}-${d}`,
      });
    }
    if (s.isTrial && s.trialEndDate) {
      const fire = addDays(s.trialEndDate, -lead);
      if (fire >= today && fire <= horizon) {
        items.push({
          date: fire,
          title: t('notif.trialTitle'),
          body: t('notif.trialBody', { name: s.name }),
          tag: `trial-${s.id}-${s.trialEndDate}`,
        });
      }
    }
  }

  for (const r of reminders) {
    const lead = r.reminderDays ?? 0;
    for (const d of getOccurrencesInRange(r, today, addDays(horizon, lead))) {
      if ((r.completions ?? []).includes(d)) continue;
      const fire = addDays(d, -lead);
      if (fire < today || fire > horizon) continue;
      items.push({
        date: fire,
        title: t('notif.reminderTitle'),
        body: t('notif.reminderBody', { name: r.name }),
        tag: `reminder-${r.id}-${d}`,
      });
    }
  }

  if (storage.isWeeklySummaryEnabled()) {
    for (let i = 0; i <= days; i++) {
      const d = addDays(today, i);
      const weekly = buildWeeklySummary(subscriptions, reminders, d, language);
      if (weekly) items.push({ date: d, ...weekly });
    }
  }

  return items;
}

const SCHEDULE_CACHE = 'notif-schedule';

/**
 * Обновляет расписание для service worker и просит браузер периодически
 * будить его (раз в ~12 часов). Работает только там, где есть Periodic
 * Background Sync (Chrome на Android для установленного приложения), и
 * браузер сам решает, как часто реально будить — гарантий нет.
 */
export async function syncBackgroundSchedule(subscriptions, reminders, language = 'ru') {
  try {
    if (typeof caches === 'undefined' || !('serviceWorker' in navigator)) return;
    const items = buildSchedule(subscriptions, reminders, language);
    const cache = await caches.open(SCHEDULE_CACHE);
    await cache.put('schedule.json', new Response(JSON.stringify({ updatedAt: Date.now(), items })));

    const registration = await navigator.serviceWorker.ready;
    if (!registration.periodicSync || !navigator.permissions) return;
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state !== 'granted') return;
    await registration.periodicSync.register('daily-check', { minInterval: 12 * 60 * 60 * 1000 });
  } catch {
    // Фоновая синхронизация — бонус: если что-то не поддерживается, уведомления
    // всё равно приходят при открытии приложения.
  }
}

/**
 * Запоминает, какие уведомления уже показаны (общий список со service worker),
 * чтобы фоновая проверка не повторила то, что приложение уже показало само.
 */
async function markShown(tag) {
  try {
    if (typeof caches === 'undefined') return;
    const cache = await caches.open(SCHEDULE_CACHE);
    const res = await cache.match('shown.json');
    const shown = res ? await res.json() : [];
    if (shown.includes(tag)) return;
    shown.push(tag);
    await cache.put('shown.json', new Response(JSON.stringify(shown.slice(-300))));
  } catch {
    // не критично
  }
}
