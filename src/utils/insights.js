// Простые эвристики для «умных подсказок» на главном экране.
// Никакого ИИ и внешних запросов — всё считается по уже имеющимся у пользователя данным.

import { toMonthly, splitPrice } from './money.js';

const DAYS_PER_MONTH = 30.44;

/**
 * Сколько денег накопительно сэкономлено с момента отмены каждой подписки —
 * ежемесячная стоимость (с учётом деления между несколькими людьми), умноженная
 * на число месяцев с даты отмены. Возвращает массив [[код_валюты, сумма], ...],
 * как и остальные суммы в приложении — конвертация не выполняется здесь.
 */
export function getSavingsSinceCancellation(subscriptions) {
  const totals = {};
  const now = Date.now();
  for (const s of subscriptions) {
    if (s.status !== 'cancelled' || !s.cancelledAt) continue;
    const months = Math.max(0, (now - new Date(s.cancelledAt).getTime()) / (86400000 * DAYS_PER_MONTH));
    const monthly = toMonthly(splitPrice(s), s.period);
    const code = s.currency ?? 'RUB';
    totals[code] = (totals[code] ?? 0) + monthly * months;
  }
  return Object.entries(totals);
}

/**
 * Приблизительная сумма, потраченная на все подписки (активные, на паузе и
 * отменённые) за всё время использования приложения — по истории цены, с учётом
 * периода списания и деления между людьми. Для отменённых подписок считается
 * только до даты отмены.
 */
export function getLifetimeSpend(subscriptions) {
  const totals = {};
  const now = Date.now();
  for (const s of subscriptions) {
    const history = s.priceHistory?.length ? s.priceHistory : [{ date: now, price: s.price }];
    const endTime = s.status === 'cancelled' && s.cancelledAt ? new Date(s.cancelledAt).getTime() : now;
    const code = s.currency ?? 'RUB';
    const count = s.splitCount > 0 ? s.splitCount : 1;
    for (let i = 0; i < history.length; i++) {
      const segStart = new Date(history[i].date).getTime();
      const segEnd = i + 1 < history.length ? new Date(history[i + 1].date).getTime() : endTime;
      if (segEnd <= segStart) continue;
      const months = (segEnd - segStart) / (86400000 * DAYS_PER_MONTH);
      const monthly = toMonthly(history[i].price / count, s.period);
      totals[code] = (totals[code] ?? 0) + monthly * months;
    }
  }
  return Object.entries(totals);
}

/**
 * Категории, где две и более активные подписки — вероятный повод присмотреться,
 * не дублируют ли они друг друга (например, два видеосервиса).
 */
// Категории, где сервисы обычно взаимозаменяемы (два стриминга почти наверняка
// дублируют друг друга) — только для них имеет смысл подсказка про дубли.
// «Софт», «Игры», «Образование» слишком разнородны: например iCloud и Claude Pro
// оба попадают в «Софт», но ничего общего не делают, и подсказка про них — шум.
const REDUNDANCY_PRONE_CATEGORIES = ['video', 'music'];

export function getDuplicateCategoryTips(subscriptions) {
  const byCategory = {};
  for (const s of subscriptions) {
    if (!REDUNDANCY_PRONE_CATEGORIES.includes(s.category)) continue;
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
