import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import NotificationBadge from '../components/NotificationBadge.jsx';
import SmartTips from '../components/SmartTips.jsx';
import { toMonthly, toAnnual, formatMoney, splitPrice, sumConverted } from '../utils/money.js';

export default function HomeScreen({ onAdd, onOpenDetail }) {
  const { activeSubscriptions } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();

  const sorted = useMemo(
    () => [...activeSubscriptions].sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate)),
    [activeSubscriptions],
  );

  // Суммы считаются отдельно по каждой валюте — конвертации нет, складывать их напрямую нельзя.
  const monthlyTotalsByCurrency = useMemo(() => {
    const totals = {};
    for (const s of sorted) {
      const code = s.currency ?? 'RUB';
      totals[code] = (totals[code] ?? 0) + toMonthly(splitPrice(s), s.period);
    }
    return Object.entries(totals);
  }, [sorted]);
  const annualTotalsByCurrency = useMemo(() => {
    const totals = {};
    for (const s of sorted) {
      const code = s.currency ?? 'RUB';
      totals[code] = (totals[code] ?? 0) + toAnnual(splitPrice(s), s.period);
    }
    return Object.entries(totals);
  }, [sorted]);

  // Если пользователь выбрал единую валюту отображения и курс ЦБ загружен — сводим
  // итог к одному числу. Если конвертация недоступна (нет сети, "grouped" и т.п.) —
  // молча остаёмся на раздельном показе по валютам.
  const monthlyConverted = useMemo(() => sumConverted(monthlyTotalsByCurrency, convert), [monthlyTotalsByCurrency, convert]);
  const annualConverted = useMemo(() => sumConverted(annualTotalsByCurrency, convert), [annualTotalsByCurrency, convert]);

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
          <div className="home-totals__value">
            {monthlyConverted !== null
              ? formatMoney(monthlyConverted, displayCurrency)
              : monthlyTotalsByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
          </div>
        </div>
        <div className="home-totals__item">
          <div className="home-totals__label">В год</div>
          <div className="home-totals__value">
            {annualConverted !== null
              ? formatMoney(annualConverted, displayCurrency)
              : annualTotalsByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
          </div>
        </div>
      </div>

      <SmartTips subscriptions={sorted} />

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
