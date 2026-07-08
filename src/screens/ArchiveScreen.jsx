import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import PresetIcon from '../components/PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { toAnnual, formatRub } from '../utils/money.js';

const PERIOD_LABEL = { week: 'нед', month: 'мес', quarter: 'кв', year: 'год' };

export default function ArchiveScreen({ onOpenDetail }) {
  const { cancelledSubscriptions, pausedSubscriptions, restoreSubscription, resumeSubscription } = useAppData();

  const savedPerYear = useMemo(
    () => cancelledSubscriptions.reduce((sum, s) => sum + toAnnual(s.price, s.period), 0),
    [cancelledSubscriptions],
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
          <div className="archive-savings__value">{formatRub(savedPerYear)} в год</div>
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
                        {formatRub(s.price)} / {PERIOD_LABEL[s.period]}
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
                        {formatRub(s.price)} / {PERIOD_LABEL[s.period]}
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
