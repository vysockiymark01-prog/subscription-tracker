import { useMemo, useState } from 'react';
import { useReminders } from '../context/RemindersContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import PresetIcon from '../components/PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { formatDaysUntil } from '../utils/dates.js';
import { getNextOccurrence, isFinished } from '../utils/reminderDates.js';

export default function RemindersScreen({ onAdd, onOpenDetail }) {
  const { reminders } = useReminders();
  const { t, tp } = useLanguage();
  const [query, setQuery] = useState('');

  const withNextDate = useMemo(
    () =>
      reminders.map((r) => ({
        reminder: r,
        next: getNextOccurrence(r),
        finished: isFinished(r),
      })),
    [reminders],
  );

  const upcoming = useMemo(
    () =>
      withNextDate
        .filter((x) => !x.finished)
        .sort((a, b) => a.next.localeCompare(b.next)),
    [withNextDate],
  );

  const finished = useMemo(() => withNextDate.filter((x) => x.finished), [withNextDate]);

  const q = query.trim().toLowerCase();
  const filteredUpcoming = q ? upcoming.filter((x) => x.reminder.name.toLowerCase().includes(q)) : upcoming;
  const filteredFinished = q ? finished.filter((x) => x.reminder.name.toLowerCase().includes(q)) : finished;

  if (reminders.length === 0) {
    return (
      <div className="screen reminders-screen reminders-screen--empty">
        <div className="empty-state">
          <h2>{t('reminders.empty.title')}</h2>
          <p>{t('reminders.empty.text')}</p>
          <button className="btn btn--primary" onClick={onAdd}>
            {t('reminders.empty.cta')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen reminders-screen">
      <p className="settings-hint">{t('reminders.hint')}</p>

      {reminders.length > 3 && (
        <input
          className="input"
          type="text"
          placeholder={t('home.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {filteredUpcoming.length === 0 && filteredFinished.length === 0 ? (
        <p className="add-catalog__empty">{t('home.searchEmpty')}</p>
      ) : (
        <>
          {filteredUpcoming.length > 0 && (
            <div className="subscription-list">
              {filteredUpcoming.map(({ reminder, next }) => {
                const icon = getIconFor(reminder);
                return (
                  <button
                    key={reminder.id}
                    className="subscription-card"
                    onClick={() => onOpenDetail(reminder.id)}
                  >
                    <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} />
                    <div className="subscription-card__info">
                      <div className="subscription-card__name">{reminder.name}</div>
                      <div className="subscription-card__meta">
                        {tp('reminders.every', reminder.intervalDays)}
                      </div>
                    </div>
                    <div className="subscription-card__due">{formatDaysUntil(next, t, tp)}</div>
                  </button>
                );
              })}
            </div>
          )}

          {filteredFinished.length > 0 && (
            <>
              <h2 className="archive-section-title">{t('reminders.finished')}</h2>
              <div className="subscription-list">
                {filteredFinished.map(({ reminder }) => {
                  const icon = getIconFor(reminder);
                  return (
                    <button
                      key={reminder.id}
                      className="subscription-card"
                      onClick={() => onOpenDetail(reminder.id)}
                    >
                      <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} />
                      <div className="subscription-card__info">
                        <div className="subscription-card__name">{reminder.name}</div>
                        <div className="subscription-card__meta">
                          {tp('reminders.every', reminder.intervalDays)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={onAdd} aria-label={t('reminders.addAria')}>
        +
      </button>
    </div>
  );
}
