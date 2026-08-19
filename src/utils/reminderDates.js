// Расчёт дат для напоминаний с произвольным интервалом в днях (не привязаны
// к календарным периодам вроде месяца/года, как у подписок — просто "раз в N дней"
// от даты начала, до даты окончания, если она задана).

import { addDays, todayISO } from './dates.js';

/**
 * Ближайшая дата события на fromIso или позже. Возвращает null, если
 * напоминание уже закончилось (есть endDate, и оно раньше этой даты).
 */
export function getNextOccurrence(reminder, fromIso = todayISO()) {
  const { startDate, intervalDays, endDate } = reminder;
  if (!startDate || !intervalDays || intervalDays < 1) return null;

  let candidate = startDate;
  if (fromIso > startDate) {
    const diffDays = Math.round((new Date(fromIso) - new Date(startDate)) / 86400000);
    const cycles = Math.floor(diffDays / intervalDays);
    candidate = addDays(startDate, cycles * intervalDays);
    if (candidate < fromIso) candidate = addDays(candidate, intervalDays);
  }

  if (endDate && candidate > endDate) return null;
  return candidate;
}

/**
 * Список ближайших N дат события — для превью в форме и деталях.
 */
export function getUpcomingOccurrences(reminder, count = 6, fromIso = todayISO()) {
  const dates = [];
  let next = getNextOccurrence(reminder, fromIso);
  let guard = 0;
  while (next && dates.length < count && guard < 1000) {
    dates.push(next);
    next = getNextOccurrence(reminder, addDays(next, 1));
    guard++;
  }
  return dates;
}

/**
 * Все даты события, попадающие в указанный диапазон [fromIso, toIso] —
 * используется для точек в календаре за конкретный месяц.
 */
export function getOccurrencesInRange(reminder, fromIso, toIso) {
  const dates = [];
  let next = getNextOccurrence(reminder, fromIso);
  let guard = 0;
  while (next && next <= toIso && guard < 500) {
    dates.push(next);
    next = getNextOccurrence(reminder, addDays(next, 1));
    guard++;
  }
  return dates;
}

/**
 * Напоминание больше не повторится (дата окончания прошла).
 */
export function isFinished(reminder, fromIso = todayISO()) {
  return getNextOccurrence(reminder, fromIso) === null;
}
