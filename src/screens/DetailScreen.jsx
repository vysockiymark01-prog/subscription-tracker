import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { CATEGORIES, PERIODS, REMINDER_OPTIONS } from '../storage.js';
import PresetIcon from '../components/PresetIcon.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';
import { getIconFor, getPresetById } from '../data/presets.js';
import { formatMoney, splitPrice, CURRENCIES } from '../utils/money.js';
import { buildSubscriptionIcs } from '../utils/ics.js';
import { vibrate } from '../utils/haptics.js';

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
  const { t } = useLanguage();
  const subscription = getById(id);
  const [form, setForm] = useState(subscription ? { ...subscription } : null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!subscription || !form) {
    return (
      <div className="overlay-screen">
        <div className="overlay-header">
          <span />
          <h2>{t('detail.notFound')}</h2>
          <button className="overlay-header__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>
      </div>
    );
  }

  const icon = getIconFor(form);
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
      currency: form.currency,
      category: form.category,
      period: form.period,
      nextPaymentDate: form.nextPaymentDate,
      isTrial: form.isTrial,
      trialEndDate: form.isTrial && form.trialEndDate ? form.trialEndDate : null,
      reminderDays: Number(form.reminderDays),
      splitCount: Number(form.splitCount) > 0 ? Number(form.splitCount) : 1,
      customColor: form.customColor || null,
      emoji: form.emoji || null,
      note: form.note || '',
    });
    onClose();
  }

  function handleCancelSubscription() {
    vibrate();
    cancelSubscription(id);
    onClose();
  }

  function handleRestore() {
    vibrate();
    restoreSubscription(id);
    onClose();
  }

  function handlePause() {
    vibrate();
    pauseSubscription(id);
    onClose();
  }

  function handleResume() {
    vibrate();
    resumeSubscription(id);
    onClose();
  }

  function handleDelete() {
    vibrate([20, 40, 20]);
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
        <h2>{t('detail.title')}</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
      </div>

      <div className="detail-icon-row">
        <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} size={56} />
      </div>

      {subscription.status === 'paused' && <div className="status-banner">{t('detail.paused')}</div>}

      <form className="subscription-form" onSubmit={handleSave}>
        <label>
          {t('add.name')}
          <input
            className="input"
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
        </label>

        <label>
          {t('add.color')}
          <ColorPicker value={form.customColor} onChange={(color) => setField('customColor', color)} />
        </label>

        <label>
          {t('add.emoji')}
          <EmojiPicker value={form.emoji ?? ''} onChange={(emoji) => setField('emoji', emoji)} />
        </label>

        <div className="form-row">
          <label>
            {t('add.price')}
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
            {t('add.currency')}
            <select className="input" value={form.currency ?? 'RUB'} onChange={(e) => setField('currency', e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          {t('add.period')}
          <select className="input" value={form.period} onChange={(e) => setField('period', e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {t(`period.${p}.full`)}
              </option>
            ))}
          </select>
        </label>

        {priceHistory.length > 1 && (
          <p className="price-history-hint">
            {priceDiff > 0
              ? t('detail.priceUp', {
                  diff: formatMoney(priceDiff, subscription.currency),
                  from: formatMoney(firstPrice, subscription.currency),
                  to: formatMoney(subscription.price, subscription.currency),
                })
              : priceDiff < 0
                ? t('detail.priceDown', { diff: formatMoney(Math.abs(priceDiff), subscription.currency) })
                : t('detail.priceSame')}
          </p>
        )}

        <label>
          {t('add.category')}
          <select className="input" value={form.category} onChange={(e) => setField('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t('add.nextPayment')}
          <input
            className="input"
            type="date"
            value={form.nextPaymentDate}
            onChange={(e) => setField('nextPaymentDate', e.target.value)}
            required
          />
        </label>

        <label>
          {t('add.split')}
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
          <p className="price-history-hint">
            {t('detail.yourShare')}{' '}
            {formatMoney(
              splitPrice({ ...subscription, price: Number(form.price), splitCount: Number(form.splitCount) }),
              form.currency,
            )}
          </p>
        )}

        <label className="toggle-row">
          <span>{t('add.trial')}</span>
          <input type="checkbox" checked={form.isTrial} onChange={(e) => setField('isTrial', e.target.checked)} />
        </label>

        {form.isTrial && (
          <label>
            {t('add.trialEnd')}
            <input
              className="input"
              type="date"
              value={form.trialEndDate ?? ''}
              onChange={(e) => setField('trialEndDate', e.target.value)}
            />
          </label>
        )}

        <label>
          {t('add.remind')}
          <select
            className="input"
            value={form.reminderDays}
            onChange={(e) => setField('reminderDays', e.target.value)}
          >
            {REMINDER_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} {t('unit.daysShort')}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t('add.note')}
          <textarea
            className="input textarea"
            rows={2}
            value={form.note ?? ''}
            onChange={(e) => setField('note', e.target.value)}
          />
        </label>

        <button className="btn btn--primary btn--block" type="submit" disabled={!isValid}>
          {t('detail.save')}
        </button>
      </form>

      <div className="detail-actions">
        <button className="btn btn--secondary btn--block" onClick={handleAddToCalendar}>
          {t('detail.addToCalendar')}
        </button>

        {preset?.cancelUrl && (
          <a className="btn btn--secondary btn--block cancel-hint-link" href={preset.cancelUrl} target="_blank" rel="noreferrer">
            {t('detail.cancelHintPrefix')} {preset.cancelHint}
          </a>
        )}

        {subscription.status === 'active' && (
          <>
            <button className="btn btn--secondary btn--block" onClick={handlePause}>
              {t('detail.pause')}
            </button>
            <button className="btn btn--secondary btn--block" onClick={handleCancelSubscription}>
              {t('detail.cancelSub')}
            </button>
          </>
        )}
        {subscription.status === 'paused' && (
          <button className="btn btn--secondary btn--block" onClick={handleResume}>
            {t('detail.resume')}
          </button>
        )}
        {subscription.status === 'cancelled' && (
          <button className="btn btn--secondary btn--block" onClick={handleRestore}>
            {t('detail.restore')}
          </button>
        )}

        {!confirmingDelete ? (
          <button className="btn btn--danger btn--block" onClick={() => setConfirmingDelete(true)}>
            {t('detail.delete')}
          </button>
        ) : (
          <div className="confirm-delete">
            <p>{t('detail.deleteConfirm')}</p>
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
    </div>
  );
}
