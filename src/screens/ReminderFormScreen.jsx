import { useMemo, useState } from 'react';
import { useReminders } from '../context/RemindersContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { todayISO, formatShortDate } from '../utils/dates.js';
import { getUpcomingOccurrences } from '../utils/reminderDates.js';
import { getIconFor } from '../data/presets.js';
import PresetIcon from '../components/PresetIcon.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';
import { vibrate } from '../utils/haptics.js';

const REMINDER_DAY_OPTIONS = [0, 1, 3, 7];

function emptyForm() {
  return {
    name: '',
    intervalDays: 7,
    startDate: todayISO(),
    endDate: '',
    reminderDays: 0,
    emoji: '',
    customColor: '',
  };
}

export default function ReminderFormScreen({ id, onClose }) {
  const { getById, addReminder, updateReminder, deleteReminder } = useReminders();
  const { t, language } = useLanguage();
  const existing = id ? getById(id) : null;
  const [form, setForm] = useState(() => (existing ? { ...emptyForm(), ...existing, endDate: existing.endDate ?? '' } : emptyForm()));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const intervalDays = Math.max(1, Number(form.intervalDays) || 1);
  const isValid = form.name.trim().length > 0 && intervalDays >= 1 && form.startDate;

  const preview = useMemo(() => {
    if (!isValid) return [];
    return getUpcomingOccurrences(
      { startDate: form.startDate, intervalDays, endDate: form.endDate || null },
      5,
    );
  }, [isValid, form.startDate, intervalDays, form.endDate]);

  const remindOptions = REMINDER_DAY_OPTIONS.filter((d) => d === 0 || d < intervalDays);

  const icon = getIconFor({ name: form.name, emoji: form.emoji, customColor: form.customColor });

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    const fields = {
      name: form.name.trim(),
      intervalDays,
      startDate: form.startDate,
      endDate: form.endDate || null,
      reminderDays: Number(form.reminderDays),
      emoji: form.emoji || null,
      customColor: form.customColor || null,
    };
    vibrate();
    if (existing) {
      updateReminder(id, fields);
    } else {
      addReminder(fields);
    }
    onClose();
  }

  function handleDelete() {
    vibrate([20, 40, 20]);
    deleteReminder(id);
    onClose();
  }

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <span />
        <h2>{existing ? t('reminders.form.editTitle') : t('reminders.form.addTitle')}</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
      </div>

      <div className="detail-icon-row">
        <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} size={56} />
      </div>

      <form className="subscription-form" onSubmit={handleSubmit}>
        <label>
          {t('reminders.form.name')}
          <input
            className="input"
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('reminders.form.namePlaceholder')}
            required
          />
        </label>

        <label>
          {t('add.color')}
          <ColorPicker value={form.customColor} onChange={(color) => setField('customColor', color)} />
        </label>

        <label>
          {t('add.emoji')}
          <EmojiPicker value={form.emoji} onChange={(emoji) => setField('emoji', emoji)} />
        </label>

        <label>
          {t('reminders.form.interval')}
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={form.intervalDays}
            onChange={(e) => setField('intervalDays', e.target.value)}
            required
          />
        </label>

        <div className="form-row">
          <label>
            {t('reminders.form.startDate')}
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              required
            />
          </label>
          <label>
            {t('reminders.form.endDate')}
            <input
              className="input"
              type="date"
              value={form.endDate}
              onChange={(e) => setField('endDate', e.target.value)}
              min={form.startDate}
            />
          </label>
        </div>
        <p className="settings-hint">{t('reminders.form.endDateHint')}</p>

        <label>
          {t('reminders.form.remind')}
          <select className="input" value={form.reminderDays} onChange={(e) => setField('reminderDays', e.target.value)}>
            {remindOptions.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? t('reminders.form.remindSameDay') : `${t('add.remind')} ${d} ${t('unit.daysShort')}`}
              </option>
            ))}
          </select>
        </label>

        {preview.length > 0 && (
          <div className="reminder-preview">
            <p className="reminder-preview__label">{t('reminders.form.preview')}</p>
            <div className="reminder-preview__dates">
              {preview.map((d) => (
                <span key={d} className="reminder-preview__date">
                  {formatShortDate(d, language)}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn--primary btn--block" type="submit" disabled={!isValid}>
          {existing ? t('detail.save') : t('reminders.form.submit')}
        </button>
      </form>

      {existing && (
        <div className="detail-actions">
          {!confirmingDelete ? (
            <button className="btn btn--danger btn--block" onClick={() => setConfirmingDelete(true)}>
              {t('detail.delete')}
            </button>
          ) : (
            <div className="confirm-delete">
              <p>{t('reminders.form.deleteConfirm')}</p>
              <div className="confirm-delete__actions">
                <button className="btn btn--secondary" onClick={() => setConfirmingDelete(false)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn--danger" onClick={handleDelete}>
                  {t('detail.deleteYes')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
