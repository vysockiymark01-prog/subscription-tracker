const PERIODS_PER_YEAR = {
  week: 52,
  month: 12,
  quarter: 4,
  year: 1,
};

export function toAnnual(price, period) {
  return price * (PERIODS_PER_YEAR[period] ?? 12);
}

export function toMonthly(price, period) {
  return toAnnual(price, period) / 12;
}

export function formatRub(amount) {
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

/**
 * Доля пользователя в стоимости подписки, если она разделена между
 * несколькими людьми (splitCount).
 */
export function splitPrice(subscription) {
  const count = subscription.splitCount > 0 ? subscription.splitCount : 1;
  return subscription.price / count;
}
