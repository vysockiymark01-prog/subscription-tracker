import { useMemo, useRef, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { toAnnual, formatMoney, splitPrice, sumConverted } from '../utils/money.js';

export default function YearReviewScreen({ onClose }) {
  const { subscriptions, activeSubscriptions, cancelledSubscriptions } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  const year = new Date().getFullYear();

  const annualByCurrency = useMemo(() => {
    const totals = {};
    for (const s of activeSubscriptions) {
      const code = s.currency ?? 'RUB';
      totals[code] = (totals[code] ?? 0) + toAnnual(splitPrice(s), s.period);
    }
    return Object.entries(totals);
  }, [activeSubscriptions]);
  const annualConverted = useMemo(() => sumConverted(annualByCurrency, convert), [annualByCurrency, convert]);

  const cancelledThisYear = useMemo(
    () => cancelledSubscriptions.filter((s) => s.cancelledAt?.startsWith(String(year))),
    [cancelledSubscriptions, year],
  );

  const savedByCurrency = useMemo(() => {
    const totals = {};
    for (const s of cancelledThisYear) {
      const code = s.currency ?? 'RUB';
      totals[code] = (totals[code] ?? 0) + toAnnual(s.price, s.period);
    }
    return Object.entries(totals);
  }, [cancelledThisYear]);
  const savedConverted = useMemo(() => sumConverted(savedByCurrency, convert), [savedByCurrency, convert]);

  const topSubscription = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;
    return [...activeSubscriptions].sort(
      (a, b) => toAnnual(splitPrice(b), b.period) - toAnnual(splitPrice(a), a.period),
    )[0];
  }, [activeSubscriptions]);

  const categoriesCount = useMemo(
    () => new Set(activeSubscriptions.map((s) => s.category)).size,
    [activeSubscriptions],
  );

  function formatTotals(byCurrency, converted) {
    if (converted !== null) return formatMoney(converted, displayCurrency);
    if (byCurrency.length === 0) return formatMoney(0, 'RUB');
    return byCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ');
  }

  async function handleShare() {
    if (!cardRef.current) return;
    setShareError(null);
    setSharing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const file = new File([blob], `itog-goda-${year}.png`, { type: 'image/png' });
        try {
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: `Мой подписочный итог ${year} года` });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `itog-goda-${year}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          // Пользователь мог просто закрыть системное окно шеринга — это не ошибка
        }
        setSharing(false);
      }, 'image/png');
    } catch {
      setShareError('Не удалось подготовить картинку для шеринга. Попробуйте ещё раз.');
      setSharing(false);
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="overlay-screen">
        <div className="overlay-header">
          <span />
          <h2>Итог года</h2>
          <button className="overlay-header__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="empty-state">
          <h2>Пока не о чем рассказать</h2>
          <p>Добавьте хотя бы одну подписку, и здесь появится годовой итог</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <span />
        <h2>Итог года</h2>
        <button className="overlay-header__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>

      <div className="year-review">
        <div className="year-review__card" ref={cardRef}>
          <div className="year-review__year">{year}</div>
          <div className="year-review__title">Подписочный итог года</div>

          <div className="year-review__big-number">{formatTotals(annualByCurrency, annualConverted)}</div>
          <div className="year-review__big-label">потрачу на подписки за год</div>

          <div className="year-review__grid">
            <div className="year-review__stat">
              <div className="year-review__stat-value">{activeSubscriptions.length}</div>
              <div className="year-review__stat-label">активных подписок</div>
            </div>
            <div className="year-review__stat">
              <div className="year-review__stat-value">{categoriesCount}</div>
              <div className="year-review__stat-label">категорий</div>
            </div>
            <div className="year-review__stat">
              <div className="year-review__stat-value">{cancelledThisYear.length}</div>
              <div className="year-review__stat-label">отменено в {year}</div>
            </div>
            <div className="year-review__stat">
              <div className="year-review__stat-value">{subscriptions.length}</div>
              <div className="year-review__stat-label">подписок за всё время</div>
            </div>
          </div>

          {topSubscription && (
            <div className="year-review__highlight">
              Самая дорогая: <b>{topSubscription.name}</b> —{' '}
              {formatMoney(toAnnual(splitPrice(topSubscription), topSubscription.period), topSubscription.currency)}
              /год
            </div>
          )}

          {cancelledThisYear.length > 0 && (
            <div className="year-review__highlight">
              Отменив {cancelledThisYear.length} {cancelledThisYear.length === 1 ? 'подписку' : 'подписки'}, сэкономил
              {' '}
              {formatTotals(savedByCurrency, savedConverted)} в год
            </div>
          )}

          <div className="year-review__footer">Трекер подписок</div>
        </div>

        <button className="btn btn--primary btn--block" onClick={handleShare} disabled={sharing}>
          {sharing ? 'Готовлю картинку…' : 'Поделиться'}
        </button>
        {shareError && <p className="settings-message settings-message--error">{shareError}</p>}
      </div>
    </div>
  );
}
