import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import NotificationBadge from '../components/NotificationBadge.jsx';
import SmartTips from '../components/SmartTips.jsx';
import { toMonthly, toAnnual, formatMoney, splitPrice, sumConverted } from '../utils/money.js';
import { vibrate } from '../utils/haptics.js';

const SORTERS = {
  date: (a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate),
  priceDesc: (a, b) => toMonthly(splitPrice(b), b.period) - toMonthly(splitPrice(a), a.period),
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
};

export default function HomeScreen({ onAdd, onOpenDetail }) {
  const { activeSubscriptions, cancelSubscription } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const sorted = useMemo(
    () => [...activeSubscriptions].sort(SORTERS[sortBy] ?? SORTERS.date),
    [activeSubscriptions, sortBy],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) => s.name.toLowerCase().includes(q));
  }, [sorted, query]);

  function handleSwipeArchive(id) {
    vibrate();
    cancelSubscription(id);
  }

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
          <h2>{t('home.empty.title')}</h2>
          <p>{t('home.empty.text')}</p>
          <button className="btn btn--primary" onClick={onAdd}>
            {t('home.empty.cta')}
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
          <div className="home-totals__label">{t('home.totals.monthly')}</div>
          <div className="home-totals__value">
            {monthlyConverted !== null
              ? formatMoney(monthlyConverted, displayCurrency)
              : monthlyTotalsByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
          </div>
        </div>
        <div className="home-totals__item">
          <div className="home-totals__label">{t('home.totals.yearly')}</div>
          <div className="home-totals__value">
            {annualConverted !== null
              ? formatMoney(annualConverted, displayCurrency)
              : annualTotalsByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
          </div>
        </div>
      </div>

      <SmartTips subscriptions={sorted} />

      {sorted.length > 3 && (
        <div className="home-toolbar">
          <input
            className="input"
            type="text"
            placeholder={t('home.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="input home-toolbar__sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">{t('home.sort.date')}</option>
            <option value="priceDesc">{t('home.sort.priceDesc')}</option>
            <option value="name">{t('home.sort.name')}</option>
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="add-catalog__empty">{t('home.searchEmpty')}</p>
      ) : (
        <div className="subscription-list">
          {filtered.map((s) => (
            <SubscriptionCard
              key={s.id}
              subscription={s}
              onClick={() => onOpenDetail(s.id)}
              onSwipeArchive={handleSwipeArchive}
            />
          ))}
        </div>
      )}

      <button className="fab" onClick={onAdd} aria-label={t('home.addAria')}>
        +
      </button>
    </div>
  );
}
