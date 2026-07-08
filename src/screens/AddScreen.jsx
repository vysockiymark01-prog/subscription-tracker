import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { searchPresets } from '../data/presets.js';
import { CATEGORIES, PERIODS, REMINDER_OPTIONS } from '../storage.js';
import { todayISO } from '../utils/dates.js';
import PresetIcon from '../components/PresetIcon.jsx';

const CATEGORY_LABEL = {
  video: 'Видео',
  music: 'Музыка',
  software: 'Софт',
  games: 'Игры',
  education: 'Образование',
  other: 'Другое',
};

const PERIOD_LABEL = {
  week: 'Еженедельно',
  month: 'Ежемесячно',
  quarter: 'Ежеквартально',
  year: 'Ежегодно',
};

function emptyForm() {
  return {
    name: '',
    price: '',
    category: 'other',
    period: 'month',
    nextPaymentDate: todayISO(),
    isTrial: false,
    trialEndDate: '',
    reminderDays: 3,
    splitCount: 1,
  };
}

export default function AddScreen({ onClose }) {
  const { activeSubscriptions, addSubscription } = useAppData();
  const { notifyFirstSubscriptionAdded } = useNotifications();
  const [step, setStep] = useState('catalog');
  const [query, setQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const results = useMemo(() => searchPresets(query), [query]);

  function openPreset(preset) {
    setSelectedPreset(preset);
    setForm({ ...emptyForm(), name: preset.name, price: preset.price, category: preset.category });
    setStep('form');
  }

  function openCustom() {
    setSelectedPreset(null);
    setForm(emptyForm());
    setStep('form');
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const isValid = form.name.trim().length > 0 && Number(form.price) > 0 && form.nextPaymentDate;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    const wasFirstSubscription = activeSubscriptions.length === 0;
    addSubscription({
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      period: form.period,
      nextPaymentDate: form.nextPaymentDate,
      isTrial: form.isTrial,
      trialEndDate: form.isTrial && form.trialEndDate ? form.trialEndDate : null,
      reminderDays: Number(form.reminderDays),
      splitCount: Number(form.splitCount) > 0 ? Number(form.splitCount) : 1,
      iconKey: selectedPreset?.id ?? null,
    });
    if (wasFirstSubscription) notifyFirstSubscriptionAdded();
    onClose();
  }

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        {step === 'form' ? (
          <button className="overlay-header__back" onClick={() => setStep('catalog')} aria-label="Назад">
            ←
          </button>
        ) : (
          <span />
        )}
        <h2>Добавление подписки</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>

      {step === 'catalog' && (
        <div className="add-catalog">
          <input
            className="input"
            type="text"
            placeholder="Поиск сервиса"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn--secondary btn--block" onClick={openCustom}>
            Своя подписка
          </button>
          <div className="preset-grid">
            {results.map((preset) => (
              <button key={preset.id} className="preset-grid__item" onClick={() => openPreset(preset)}>
                <PresetIcon color={preset.color} letter={preset.letter} />
                <span>{preset.name}</span>
              </button>
            ))}
            {results.length === 0 && <p className="add-catalog__empty">Ничего не найдено</p>}
          </div>
        </div>
      )}

      {step === 'form' && (
        <form className="subscription-form" onSubmit={handleSubmit}>
          <label>
            Название
            <input
              className="input"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Цена, ₽
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                required
              />
            </label>
            <label>
              Период
              <select className="input" value={form.period} onChange={(e) => setField('period', e.target.value)}>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            На скольких делится подписка
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              value={form.splitCount}
              onChange={(e) => setField('splitCount', e.target.value)}
            />
          </label>

          <label>
            Категория
            <select className="input" value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Дата следующего списания
            <input
              className="input"
              type="date"
              value={form.nextPaymentDate}
              onChange={(e) => setField('nextPaymentDate', e.target.value)}
              required
            />
          </label>

          <label className="toggle-row">
            <span>Пробный период</span>
            <input
              type="checkbox"
              checked={form.isTrial}
              onChange={(e) => setField('isTrial', e.target.checked)}
            />
          </label>

          {form.isTrial && (
            <label>
              Дата окончания триала
              <input
                className="input"
                type="date"
                value={form.trialEndDate}
                onChange={(e) => setField('trialEndDate', e.target.value)}
              />
            </label>
          )}

          <label>
            Напомнить за
            <select
              className="input"
              value={form.reminderDays}
              onChange={(e) => setField('reminderDays', e.target.value)}
            >
              {REMINDER_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? 'день' : 'дня'}
                </option>
              ))}
            </select>
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={!isValid}>
            Добавить подписку
          </button>
        </form>
      )}
    </div>
  );
}
