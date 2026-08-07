// Простые эвристики для «умных подсказок» на главном экране.
// Никакого ИИ и внешних запросов — всё считается по уже имеющимся у пользователя данным.

/**
 * Категории, где две и более активные подписки — вероятный повод присмотреться,
 * не дублируют ли они друг друга (например, два видеосервиса).
 */
export function getDuplicateCategoryTips(subscriptions) {
  const byCategory = {};
  for (const s of subscriptions) {
    if (s.category === 'other') continue;
    (byCategory[s.category] ??= []).push(s);
  }
  return Object.entries(byCategory)
    .filter(([, list]) => list.length >= 2)
    .map(([category, list]) => ({
      category,
      count: list.length,
      names: list.map((s) => s.name),
    }));
}

/**
 * Подписки, у которых текущая цена выше самой первой зафиксированной в истории.
 */
export function getPriceIncreaseTips(subscriptions) {
  return subscriptions
    .filter((s) => {
      const history = s.priceHistory ?? [];
      return history.length >= 2 && s.price > history[0].price;
    })
    .map((s) => ({
      name: s.name,
      from: s.priceHistory[0].price,
      to: s.price,
      currency: s.currency ?? 'RUB',
    }));
}

/**
 * Подписки, добавленные давно и ни разу не менявшиеся в цене — мягкое напоминание
 * "всё ещё нужна?", без осуждения.
 */
export function getStaleSubscriptionTips(subscriptions, { staleDays = 180 } = {}) {
  const now = Date.now();
  return subscriptions.filter((s) => {
    const added = s.priceHistory?.[0]?.date;
    if (!added) return false;
    const days = (now - new Date(added).getTime()) / 86400000;
    return days >= staleDays && (s.priceHistory?.length ?? 0) === 1;
  });
}

/**
 * Пора ли напомнить про бэкап: включено ли напоминание в настройках и прошло ли
 * достаточно дней с последнего экспорта данных (или его вообще не было).
 */
export function shouldRemindBackup(reminderDays, lastExportAt) {
  if (!reminderDays || reminderDays <= 0) return false;
  if (!lastExportAt) return true;
  const days = (Date.now() - new Date(lastExportAt).getTime()) / 86400000;
  return days >= reminderDays;
}
