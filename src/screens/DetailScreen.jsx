import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { CATEGORIES, PERIODS, REMINDER_OPTIONS } from '../storage.js';
import PresetIcon from '../components/PresetIcon.jsx';
import { getIconFor, getPresetById } from '../data/presets.js';
import { formatRub, splitPrice } from '../utils/money.js';
import { buildSubscriptionIcs } from '../utils/ics.js';

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

export default function DetailScreen({ id, onClose }) {
  const {
    getById,
    updateSubscription,
    cancelSubscription,
    restoreSubscription,
    pauseSubscription,
    resumeSubscription,
    deleteSubscription,
  } = useAppData();
  const subscription = getById(id);
  const [form, setForm] = useState(subscription ? { ...subscription } : null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!subscription || !form) {
    return (
      <div className="overlay-screen">
        <div className="overlay-header">
          <span />
          <h2>Подписка не найдена</h2>
          <button className="overlay-header__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
      </div>
    );
  }

  const icon = getIconFor(subscription);
  const preset = subscription.iconKey ? getPresetById(subscription.iconKey) : null;
  const priceHistory = subscription.priceHistory ?? [];
  const firstPrice = priceHistory[0]?.price ?? subscription.price;
  const priceDiff = subscription.price - firstPrice;

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    updateSubscription(id, {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      period: form.period,
      nextPaymentDate: form.nextPaymentDate,
      isTrial: form.isTrial,
      trialEndDate: form.isTrial && form.trialEndDate ? form.trialEndDate : null,
      reminderDays: Number(form.reminderDays),
      splitCount: Number(form.splitCount) > 0 ? Number(form.splitCount) : 1,
    });
    onClose();
  }

  function handleCancelSubscription() {
    cancelSubscription(id);
    onClose();
  }

  function handleRestore() {
    restoreSubscription(id);
    onClose();
  }

  function handlePause() {
    pauseSubscription(id);
    onClose();
  }

  function handleResume() {
    resumeSubscription(id);
    onClose();
  }

  function handleDelete() {
    deleteSubscription(id);
    onClose();
  }

  function handleAddToCalendar() {
    const ics = buildSubscriptionIcs(subscription);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subscription.name}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isValid = form.name.trim().length > 0 && Number(form.price) > 0 && form.nextPaymentDate;

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <span />
        <h2>Подписка</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>

      <div className="detail-icon-row">
        <PresetIcon color={icon.color} letter={icon.letter} size={56} />
      </div>

      {subscription.status === 'paused' && <div className="status-banner">Подписка на паузе</div>}

      <form className="subscription-form" onSubmit={handleSave}>
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

        {priceHistory.length > 1 && (
          <p className="price-history-hint">
            {priceDiff > 0
              ? `Цена выросла на ${formatRub(priceDiff)} с момента добавления (${formatRub(firstPrice)} → ${formatRub(subscription.price)})`
              : priceDiff < 0
                ? `Цена снизилась на ${formatRub(Math.abs(priceDiff))} с момента добавления`
                : 'Цена не менялась с момента добавления'}
          </p>
        )}

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

        <label>
          На скольких делится подписка
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={form.splitCount ?? 1}
            onChange={(e) => setField('splitCount', e.target.value)}
          />
        </label>
        {Number(form.splitCount) > 1 && (
          <p className="price-history-hint">Ваша доля: {formatRub(splitPrice({ ...subscription, price: Number(form.price), splitCount: Number(form.splitCount) }))}</p>
        )}

        <label className="toggle-row">
          <span>Пробный период</span>
          <input type="checkbox" checked={form.isTrial} onChange={(e) => setField('isTrial', e.target.checked)} />
        </label>

        {form.isTrial && (
          <label>
            Дата окончания триала
            <input
              className="input"
              type="date"
              value={form.trialEndDate ?? ''}
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
          Сохранить
        </button>
      </form>

      <div className="detail-actions">
        <button className="btn btn--secondary btn--block" onClick={handleAddToCalendar}>
          Добавить в календарь
        </button>

        {preset?.cancelUrl && (
          <a className="btn btn--secondary btn--block cancel-hint-link" href={preset.cancelUrl} target="_blank" rel="noreferrer">
            Как отменить: {preset.cancelHint}
          </a>
        )}

        {subscription.status === 'active' && (
          <>
            <button className="btn btn--secondary btn--block" onClick={handlePause}>
              Поставить на паузу
            </button>
            <button className="btn btn--secondary btn--block" onClick={handleCancelSubscription}>
              Отменил подписку
            </button>
          </>
        )}
        {subscription.status === 'paused' && (
          <button className="btn btn--secondary btn--block" onClick={handleResume}>
            Возобновить
          </button>
        )}
        {subscription.status === 'cancelled' && (
          <button className="btn btn--secondary btn--block" onClick={handleRestore}>
            Вернуть в активные
          </button>
        )}

        {!confirmingDelete ? (
          <button className="btn btn--danger btn--block" onClick={() => setConfirmingDelete(true)}>
            Удалить
          </button>
        ) : (
          <div className="confirm-delete">
            <p>Удалить подписку без возможности восстановления?</p>
            <div className="confirm-delete__actions">
              <button className="btn btn--secondary" onClick={() => setConfirmingDelete(false)}>
                Отмена
              </button>
              <button className="btn btn--danger" onClick={handleDelete}>
                Да, удалить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
