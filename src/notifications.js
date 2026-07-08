import { daysUntil } from './utils/dates.js';
import { formatRub } from './utils/money.js';

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
 * о приближающихся списаниях и окончании пробных периодов.
 * Вызывается один раз при открытии приложения.
 */
export function checkAndNotify(subscriptions) {
  if (getPermission() !== 'granted') return;

  for (const s of subscriptions) {
    if (s.status !== 'active') continue;

    const daysToPayment = daysUntil(s.nextPaymentDate);
    if (daysToPayment === s.reminderDays) {
      showNotification('Скоро списание', {
        body: `${s.name}: ${formatRub(s.price)} через ${daysToPayment} дн.`,
        tag: `payment-${s.id}-${s.nextPaymentDate}`,
      });
    }

    if (s.isTrial && s.trialEndDate) {
      const daysToTrialEnd = daysUntil(s.trialEndDate);
      if (daysToTrialEnd === s.reminderDays) {
        showNotification('Пробный период заканчивается', {
          body: `${s.name}: отмени, если не нужно`,
          tag: `trial-${s.id}-${s.trialEndDate}`,
        });
      }
    }
  }
}
