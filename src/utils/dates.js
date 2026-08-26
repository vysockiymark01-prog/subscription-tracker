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
 *
 * anchorDay — «настоящее» число месяца списания (напр. 31), которое нужно
 * сохранять при повторных вызовах подряд. Без него после одного короткого
 * месяца (30 дней вместо 31) число навсегда съезжало бы вниз: 31 → 30 (сент.) →
 * 30 (окт., хотя там 31 день есть!) → 30 (нояб.) и так далее. С anchorDay
 * каждый следующий месяц считается заново от исходного числа, поэтому в
 * октябре и декабре (где 31 день) дата снова становится 31-м.
 */
export function addPeriod(dateStr, period, anchorDay) {
  const [y, m, dd] = dateStr.split('-').map(Number);

  if (period === 'week') {
    const d = new Date(y, m - 1, dd);
    d.setDate(d.getDate() + 7);
    return toLocalISODate(d);
  }

  const targetDay = anchorDay ?? dd;
  let year = y;
  let month = m - 1; // 0-индексация месяца
  if (period === 'year') {
    year += 1;
  } else if (period === 'quarter') {
    month += 3;
  } else {
    month += 1;
  }
  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(targetDay, daysInMonth);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Сдвигает дату вперёд на нужное число периодов, пока она не окажется
 * сегодня или в будущем. Используется для подписок, которые не открывали
 * дольше одного периода — nextPaymentDate мог устареть на несколько шагов.
 * anchorDay фиксируется один раз от исходной даты — см. комментарий в addPeriod.
 */
export function advanceOverdueDate(dateStr, period) {
  const anchorDay = Number(dateStr.slice(-2));
  let current = dateStr;
  let guard = 0;
  while (daysUntil(current) < 0 && guard < 1000) {
    current = addPeriod(current, period, anchorDay);
    guard++;
  }
  return current;
}
