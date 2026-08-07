import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import PresetIcon from '../components/PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { toAnnual, formatMoney, sumConverted } from '../utils/money.js';

const PERIOD_LABEL = { week: 'нед', month: 'мес', quarter: 'кв', year: 'год' };

export default function ArchiveScreen({ onOpenDetail }) {
  const { cancelledSubscriptions, pausedSubscriptions, restoreSubscription, resumeSubscription } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();

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

  if (cancelledSubscriptions.length === 0 && pausedSubscriptions.length === 0) {
    return (
      <div className="screen archive-screen archive-screen--empty">
        <div className="empty-state">
          <h2>Архив пуст</h2>
          <p>Здесь появятся отменённые и приостановленные подписки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen archive-screen">
      {cancelledSubscriptions.length > 0 && (
        <div className="archive-savings">
          <div className="archive-savings__label">Ты экономишь</div>
          <div className="archive-savings__value">
            {savedPerYearConverted !== null
              ? formatMoney(savedPerYearConverted, displayCurrency)
              : savedPerYearByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}{' '}
            в год
          </div>
        </div>
      )}

      {pausedSubscriptions.length > 0 && (
        <>
          <h2 className="archive-section-title">На паузе</h2>
          <div className="subscription-list">
            {pausedSubscriptions.map((s) => {
              const icon = getIconFor(s);
              return (
                <div key={s.id} className="archive-item">
                  <button className="archive-item__main" onClick={() => onOpenDetail(s.id)}>
                    <PresetIcon color={icon.color} letter={icon.letter} />
                    <div className="subscription-card__info">
                      <div className="subscription-card__name">{s.name}</div>
                      <div className="subscription-card__meta">
                        {formatMoney(s.price, s.currency)} / {PERIOD_LABEL[s.period]}
                      </div>
                    </div>
                  </button>
                  <button className="btn btn--secondary" onClick={() => resumeSubscription(s.id)}>
                    Возобновить
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {cancelledSubscriptions.length > 0 && (
        <>
          <h2 className="archive-section-title">Отменённые</h2>
          <div className="subscription-list">
            {cancelledSubscriptions.map((s) => {
              const icon = getIconFor(s);
              return (
                <div key={s.id} className="archive-item">
                  <button className="archive-item__main" onClick={() => onOpenDetail(s.id)}>
                    <PresetIcon color={icon.color} letter={icon.letter} />
                    <div className="subscription-card__info">
                      <div className="subscription-card__name">{s.name}</div>
                      <div className="subscription-card__meta">
                        {formatMoney(s.price, s.currency)} / {PERIOD_LABEL[s.period]}
                      </div>
                    </div>
                  </button>
                  <button className="btn btn--secondary" onClick={() => restoreSubscription(s.id)}>
                    Вернуть
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
