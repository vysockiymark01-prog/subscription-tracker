import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import PresetIcon from '../components/PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { toAnnual, formatMoney, sumConverted } from '../utils/money.js';
import { getSavingsSinceCancellation } from '../utils/insights.js';

export default function ArchiveScreen({ onOpenDetail }) {
  const { cancelledSubscriptions, pausedSubscriptions, restoreSubscription, resumeSubscription } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filteredPaused = q ? pausedSubscriptions.filter((s) => s.name.toLowerCase().includes(q)) : pausedSubscriptions;
  const filteredCancelled = q
    ? cancelledSubscriptions.filter((s) => s.name.toLowerCase().includes(q))
    : cancelledSubscriptions;
  const totalCount = pausedSubscriptions.length + cancelledSubscriptions.length;
  const nothingFound = q && filteredPaused.length === 0 && filteredCancelled.length === 0;

  const savedPerYearByCurrency = useMemo(() => {
    const totals = {};
    for (const s of cancelledSubscriptions) {
      const code = s.currency ?? 'RUB';
      totals[code] = (totals[code] ?? 0) + toAnnual(s.price, s.period);
    }
    return Object.entries(totals);
  }, [cancelledSubscriptions]);
  const savedPerYearConverted = useMemo(
    () => sumConverted(savedPerYearByCurrency, convert),
    [savedPerYearByCurrency, convert],
  );

  const savedSinceCancelByCurrency = useMemo(
    () => getSavingsSinceCancellation(cancelledSubscriptions),
    [cancelledSubscriptions],
  );
  const savedSinceCancelConverted = useMemo(
    () => sumConverted(savedSinceCancelByCurrency, convert),
    [savedSinceCancelByCurrency, convert],
  );

  if (cancelledSubscriptions.length === 0 && pausedSubscriptions.length === 0) {
    return (
      <div className="screen archive-screen archive-screen--empty">
        <div className="empty-state">
          <h2>{t('archive.empty.title')}</h2>
          <p>{t('archive.empty.text')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen archive-screen">
      {cancelledSubscriptions.length > 0 && (
        <div className="archive-savings">
          <div className="archive-savings__label">{t('archive.savings')}</div>
          <div className="archive-savings__value">
            {savedPerYearConverted !== null
              ? formatMoney(savedPerYearConverted, displayCurrency)
              : savedPerYearByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}{' '}
            {t('archive.perYear')}
          </div>
          {savedSinceCancelByCurrency.length > 0 && (
            <div className="archive-savings__accumulated">
              {t('archive.savingsSinceCancel')}:{' '}
              {savedSinceCancelConverted !== null
                ? formatMoney(savedSinceCancelConverted, displayCurrency)
                : savedSinceCancelByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
            </div>
          )}
        </div>
      )}

      {totalCount > 3 && (
        <input
          className="input"
          type="text"
          placeholder={t('home.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {nothingFound && <p className="add-catalog__empty">{t('home.searchEmpty')}</p>}

      {filteredPaused.length > 0 && (
        <>
          <h2 className="archive-section-title">{t('archive.paused')}</h2>
          <div className="subscription-list">
            {filteredPaused.map((s) => {
              const icon = getIconFor(s);
              return (
                <div key={s.id} className="archive-item">
                  <button className="archive-item__main" onClick={() => onOpenDetail(s.id)}>
                    <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} />
                    <div className="subscription-card__info">
                      <div className="subscription-card__name">{s.name}</div>
                      <div className="subscription-card__meta">
                        {formatMoney(s.price, s.currency)} / {t(`period.${s.period}.short`)}
                        {s.oneTime && ` · ${t('subscriptionCard.oneTime')}`}
                      </div>
                    </div>
                  </button>
                  <button className="btn btn--secondary" onClick={() => resumeSubscription(s.id)}>
                    {t('archive.resume')}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {filteredCancelled.length > 0 && (
        <>
          <h2 className="archive-section-title">{t('archive.cancelled')}</h2>
          <div className="subscription-list">
            {filteredCancelled.map((s) => {
              const icon = getIconFor(s);
              return (
                <div key={s.id} className="archive-item">
                  <button className="archive-item__main" onClick={() => onOpenDetail(s.id)}>
                    <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} />
                    <div className="subscription-card__info">
                      <div className="subscription-card__name">{s.name}</div>
                      <div className="subscription-card__meta">
                        {formatMoney(s.price, s.currency)} / {t(`period.${s.period}.short`)}
                        {s.oneTime && ` · ${t('subscriptionCard.oneTime')}`}
                      </div>
                    </div>
                  </button>
                  <button className="btn btn--secondary" onClick={() => restoreSubscription(s.id)}>
                    {t('archive.restore')}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
