import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { vibrate } from '../utils/haptics.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { searchPresets } from '../data/presets.js';
import { CATEGORIES, PERIODS, REMINDER_OPTIONS, getCustomCategories } from '../storage.js';
import { todayISO } from '../utils/dates.js';
import { CURRENCIES } from '../utils/money.js';
import PresetIcon from '../components/PresetIcon.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';

function emptyForm() {
  return {
    name: '',
    price: '',
    currency: 'RUB',
    category: 'other',
    period: 'month',
    nextPaymentDate: todayISO(),
    isTrial: false,
    trialEndDate: '',
    reminderDays: 3,
    splitCount: 1,
    oneTime: false,
    customColor: '',
    emoji: '',
    note: '',
  };
}

export default function AddScreen({ onClose }) {
  const { activeSubscriptions, addSubscription } = useAppData();
  const { notifyFirstSubscriptionAdded } = useNotifications();
  const { t } = useLanguage();
  const [step, setStep] = useState('catalog');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [customCategories] = useState(() => getCustomCategories());

  const results = useMemo(() => {
    const bySearch = searchPresets(query);
    return activeCategory === 'all' ? bySearch : bySearch.filter((p) => p.category === activeCategory);
  }, [query, activeCategory]);

  function openPreset(preset) {
    setSelectedPreset(preset);
    setForm({
      ...emptyForm(),
      name: preset.name,
      price: preset.price,
      category: preset.category,
      currency: preset.currency || 'RUB',
    });
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
      currency: form.currency,
      nextPaymentDate: form.nextPaymentDate,
      isTrial: form.isTrial,
      trialEndDate: form.isTrial && form.trialEndDate ? form.trialEndDate : null,
      reminderDays: Number(form.reminderDays),
      splitCount: Number(form.splitCount) > 0 ? Number(form.splitCount) : 1,
      oneTime: form.oneTime,
      iconKey: selectedPreset?.id ?? null,
      customColor: form.customColor || null,
      emoji: form.emoji || null,
      note: form.note.trim(),
    });
    vibrate();
    if (wasFirstSubscription) notifyFirstSubscriptionAdded();
    onClose();
  }

  const previewColor = form.customColor || selectedPreset?.color || '#6C5CE7';
  const previewLetter = selectedPreset?.letter ?? (form.name.trim().charAt(0).toUpperCase() || '?');
  const previewEmoji = form.emoji || null;

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        {step === 'form' ? (
          <button className="overlay-header__back" onClick={() => setStep('catalog')} aria-label={t('common.back')}>
            ←
          </button>
        ) : (
          <span />
        )}
        <h2>{t('add.title')}</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
      </div>

      {step === 'catalog' && (
        <div className="add-catalog">
          <input
            className="input"
            type="text"
            placeholder={t('add.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn--secondary btn--block" onClick={openCustom}>
            {t('add.custom')}
          </button>
          <div className="category-tabs">
            <button
              className={`category-tabs__item${activeCategory === 'all' ? ' category-tabs__item--active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              {t('add.categoryAll')}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`category-tabs__item${activeCategory === c ? ' category-tabs__item--active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {t(`category.${c}`)}
              </button>
            ))}
          </div>
          <div className="preset-grid">
            {results.map((preset) => (
              <button key={preset.id} className="preset-grid__item" onClick={() => openPreset(preset)}>
                <PresetIcon color={preset.color} letter={preset.letter} />
                <span>{preset.name}</span>
              </button>
            ))}
            {results.length === 0 && <p className="add-catalog__empty">{t('add.empty')}</p>}
          </div>
        </div>
      )}

      {step === 'form' && (
        <form className="subscription-form" onSubmit={handleSubmit}>
          <div className="detail-icon-row">
            <PresetIcon color={previewColor} letter={previewLetter} emoji={previewEmoji} size={56} />
          </div>

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
            <EmojiPicker value={form.emoji} onChange={(emoji) => setField('emoji', emoji)} />
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
              <select className="input" value={form.currency} onChange={(e) => setField('currency', e.target.value)}>
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
            <select
              className="input"
              value={form.oneTime ? 'once' : form.period}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'once') {
                  setForm((f) => ({ ...f, oneTime: true }));
                } else {
                  setForm((f) => ({ ...f, period: v, oneTime: false }));
                }
              }}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`period.${p}.full`)}
                </option>
              ))}
              <option value="once">{t('period.once.full')}</option>
            </select>
          </label>
          {form.oneTime && <p className="settings-hint">{t('add.oneTime.hint')}</p>}

          <label>
            {t('add.split')}
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
            {t('add.category')}
            <select className="input" value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
              {customCategories.length > 0 && (
                <optgroup label={t('settings.categories.title')}>
                  {customCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
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

          <label className="toggle-row">
            <span>{t('add.trial')}</span>
            <input
              type="checkbox"
              checked={form.isTrial}
              onChange={(e) => setField('isTrial', e.target.checked)}
            />
          </label>

          {form.isTrial && (
            <label>
              {t('add.trialEnd')}
              <input
                className="input"
                type="date"
                value={form.trialEndDate}
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
              value={form.note}
              onChange={(e) => setField('note', e.target.value)}
            />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={!isValid}>
            {t('add.submit')}
          </button>
        </form>
      )}
    </div>
  );
}
