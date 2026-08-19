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
 * Прибавляет (или отнимает, если days отрицательное) целое число дней к дате.
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

/**
 * Разница в днях между датой и сегодня. Отрицательное число — дата в прошлом.
 */
export function daysUntil(dateStr) {
  const target = startOfDay(dateStr);
  const today = startOfDay(new Date());
  return Math.round((target - today) / MS_PER_DAY);
}

const LOCALE_TAGS = { ru: 'ru-RU', kk: 'kk-KZ', uk: 'uk-UA', be: 'be-BY', uz: 'uz-UZ' };

/**
 * Дата в коротком читаемом виде ("5 авг.") на языке интерфейса.
 */
export function formatShortDate(dateStr, language = 'ru') {
  return new Date(dateStr).toLocaleDateString(LOCALE_TAGS[language] ?? 'ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Человекочитаемое описание оставшегося времени до списания на языке интерфейса.
 * t — функция перевода (для "сегодня"/"завтра"/"вчера"), tp — функция перевода
 * с учётом множественного числа (для "через N дней") из LanguageContext.
 */
export function formatDaysUntil(dateStr, t, tp) {
  const n = daysUntil(dateStr);
  if (n === 0) return t('date.today');
  if (n === 1) return t('date.tomorrow');
  if (n === -1) return t('date.yesterday');
  if (n < 0) return tp('date.daysAgo', Math.abs(n));
  return tp('date.inDays', n);
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
