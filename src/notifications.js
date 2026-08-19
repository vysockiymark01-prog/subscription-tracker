import { daysUntil, todayISO } from './utils/dates.js';
import { formatMoney } from './utils/money.js';
import { LOCALES, DEFAULT_LOCALE, interpolate } from './i18n/index.js';
import * as storage from './storage.js';
import { shouldRemindBackup } from './utils/insights.js';
import { getNextOccurrence } from './utils/reminderDates.js';

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
