import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import NotificationBadge from '../components/NotificationBadge.jsx';
import { toMonthly, toAnnual, formatRub, splitPrice } from '../utils/money.js';

export default function HomeScreen({ onAdd, onOpenDetail }) {
  const { activeSubscriptions } = useAppData();

  const sorted = useMemo(
    () => [...activeSubscriptions].sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate)),
    [activeSubscriptions],
  );

  const monthlyTotal = useMemo(
    () => sorted.reduce((sum, s) => sum + toMonthly(splitPrice(s), s.period), 0),
    [sorted],
  );
  const annualTotal = useMemo(
    () => sorted.reduce((sum, s) => sum + toAnnual(splitPrice(s), s.period), 0),
    [sorted],
  );

  if (sorted.length === 0) {
    return (
      <div className="screen home-screen home-screen--empty">
        <div className="empty-state">
          <h2>Пока нет подписок</h2>
          <p>Добавь первую подписку, чтобы отслеживать списания</p>
          <button className="btn btn--primary" onClick={onAdd}>
            Добавить первую подписку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen home-screen">
      <NotificationBadge />
      <div className="home-totals">
        <div className="home-totals__item">
          <div className="home-totals__label">В месяц</div>
          <div className="home-totals__value">{formatRub(monthlyTotal)}</div>
        </div>
        <div className="home-totals__item">
          <div className="home-totals__label">В год</div>
          <div className="home-totals__value">{formatRub(annualTotal)}</div>
        </div>
      </div>

      <div className="subscription-list">
        {sorted.map((s) => (
          <SubscriptionCard key={s.id} subscription={s} onClick={() => onOpenDetail(s.id)} />
        ))}
      </div>

      <button className="fab" onClick={onAdd} aria-label="Добавить подписку">
        +
      </button>
    </div>
  );
}
