const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Форматирует Date в YYYY-MM-DD по локальным компонентам даты.
 * Нельзя использовать toISOString() для этого: она конвертирует в UTC
 * и при положительном часовом поясе (вся Россия/СНГ) откатывает дату
 * на день назад для времени ближе к полуночи.
 */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toLocalISODate(new Date());
}

/**
 * Разница в днях между датой и сегодня. Отрицательное число — дата в прошлом.
 */
export function daysUntil(dateStr) {
  const target = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return Math.round((target - today) / MS_PER_DAY);
}

export function formatDateRu(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function pluralizeDays(n) {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
  return 'дней';
}

/**
 * Человекочитаемое описание оставшегося времени до списания.
 */
export function formatDaysUntil(dateStr) {
  const n = daysUntil(dateStr);
  if (n === 0) return 'сегодня';
  if (n === 1) return 'завтра';
  if (n === -1) return 'вчера';
  if (n < 0) return `${Math.abs(n)} ${pluralizeDays(n)} назад`;
  return `через ${n} ${pluralizeDays(n)}`;
}

/**
 * Прибавляет один период к дате. Если в целевом месяце меньше дней
 * (напр. 31 янв + месяц), дата прижимается к последнему дню этого месяца.
 */
export function addPeriod(dateStr, period) {
  const d = new Date(dateStr + 'T00:00:00');

  if (period === 'week') {
    d.setDate(d.getDate() + 7);
    return toLocalISODate(d);
  }

  const day = d.getDate();
  if (period === 'year') {
    d.setFullYear(d.getFullYear() + 1);
  } else if (period === 'quarter') {
    d.setMonth(d.getMonth() + 3);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  if (d.getDate() !== day) {
    d.setDate(0); // откатывает к последнему дню предыдущего (целевого) месяца
  }
  return toLocalISODate(d);
}

/**
 * Сдвигает дату вперёд на нужное число периодов, пока она не окажется
 * сегодня или в будущем. Используется для подписок, которые не открывали
 * дольше одного периода — nextPaymentDate мог устареть на несколько шагов.
 */
export function advanceOverdueDate(dateStr, period) {
  let current = dateStr;
  let guard = 0;
  while (daysUntil(current) < 0 && guard < 1000) {
    current = addPeriod(current, period);
    guard++;
  }
  return current;
}
