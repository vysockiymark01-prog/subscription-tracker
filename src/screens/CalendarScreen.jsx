import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { addPeriod, todayISO } from '../utils/dates.js';
import { formatMoney } from '../utils/money.js';
import { getIconFor } from '../data/presets.js';
import PresetIcon from '../components/PresetIcon.jsx';

const LOCALE_TAGS = { ru: 'ru-RU', kk: 'kk-KZ', uk: 'uk-UA', be: 'be-BY', uz: 'uz-UZ' };

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/**
 * Даты списания подписки, которые попадают в указанный месяц — проецируем
 * вперёд от nextPaymentDate. Для месяцев до nextPaymentDate ничего не находим,
 * так как прошлых дат списаний приложение не хранит (только историю цены).
 */
function occurrencesInMonth(subscription, year, month) {
  const monthStart = toIsoDate(year, month, 1);
  const monthEnd = toIsoDate(year, month, new Date(year, month + 1, 0).getDate());
  const dates = [];
  let current = subscription.nextPaymentDate;
  let guard = 0;
  while (guard < 60) {
    if (current > monthEnd) break;
    if (current >= monthStart) dates.push(current);
    current = addPeriod(current, subscription.period);
    guard++;
  }
  return dates;
}

export default function CalendarScreen() {
  const { activeSubscriptions } = useAppData();
  const { t, language } = useLanguage();
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(today);

  // Прошлых списаний приложение не хранит, поэтому не даём листать раньше текущего месяца.
  const isAtCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const s of activeSubscriptions) {
      for (const date of occurrencesInMonth(s, cursor.year, cursor.month)) {
        (map[date] ??= []).push(s);
      }
    }
    return map;
  }, [activeSubscriptions, cursor]);

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(cursor.year, cursor.month, 1);
    // Понедельник — первый день недели.
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(LOCALE_TAGS[language] ?? 'ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const weekdayLabels = useMemo(() => {
    // Понедельник 2024-01-01 как опорная точка для получения коротких названий дней недели.
    const base = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(LOCALE_TAGS[language] ?? 'ru-RU', { weekday: 'short' });
    });
  }, [language]);

  function goPrevMonth() {
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  }

  function goNextMonth() {
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  }

  const selectedEvents = eventsByDay[selectedDay] ?? [];

  return (
    <div className="screen calendar-screen">
      <h2>{t('calendar.title')}</h2>

      <div className="calendar-nav">
        <button
          className="calendar-nav__arrow"
          onClick={goPrevMonth}
          disabled={isAtCurrentMonth}
          aria-label={t('calendar.prevMonth')}
        >
          ←
        </button>
        <div className="calendar-nav__label">{monthLabel}</div>
        <button className="calendar-nav__arrow" onClick={goNextMonth} aria-label={t('calendar.nextMonth')}>
          →
        </button>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map((w) => (
          <div key={w} className="calendar-grid__weekday">
            {w}
          </div>
        ))}
        {weeks.map((row, ri) =>
          row.map((day, ci) => {
            if (day === null) return <div key={`${ri}-${ci}`} className="calendar-grid__cell calendar-grid__cell--empty" />;
            const iso = toIsoDate(cursor.year, cursor.month, day);
            const hasEvents = Boolean(eventsByDay[iso]?.length);
            const isToday = iso === today;
            const isSelected = iso === selectedDay;
            return (
              <button
                key={iso}
                className={`calendar-grid__cell${isToday ? ' calendar-grid__cell--today' : ''}${
                  isSelected ? ' calendar-grid__cell--selected' : ''
                }`}
                onClick={() => setSelectedDay(iso)}
              >
                {day}
                {hasEvents && <span className="calendar-grid__dot" />}
              </button>
            );
          }),
        )}
      </div>

      <p className="settings-hint">{t('calendar.legend')}</p>

      <div className="calendar-day-events">
        {selectedEvents.length === 0 ? (
          <p className="calendar-day-events__empty">{t('calendar.selectedDay.empty')}</p>
        ) : (
          <div className="subscription-list">
            {selectedEvents.map((s) => {
              const icon = getIconFor(s);
              return (
                <div key={s.id} className="subscription-card">
                  <PresetIcon color={icon.color} letter={icon.letter} />
                  <div className="subscription-card__info">
                    <div className="subscription-card__name">{s.name}</div>
                    <div className="subscription-card__meta">{formatMoney(s.price, s.currency)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
