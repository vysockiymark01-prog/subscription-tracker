import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { CATEGORIES } from '../storage.js';
import { toMonthly, toAnnual, formatMoney, splitPrice } from '../utils/money.js';

const CATEGORY_LABEL = {
  video: 'Видео',
  music: 'Музыка',
  software: 'Софт',
  games: 'Игры',
  education: 'Образование',
  other: 'Другое',
};

export default function StatsScreen({ onOpenYearReview }) {
  const { activeSubscriptions } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();

  // Группируем по категории; если для валюты подписки доступна конвертация в
  // выбранную валюту отображения — сводим в неё, иначе оставляем отдельной строкой.
  const byCategory = useMemo(() => {
    const totals = {};
    for (const s of activeSubscriptions) {
      const monthly = toMonthly(splitPrice(s), s.period);
      const converted = convert(monthly, s.currency ?? 'RUB');
      const amount = converted ?? monthly;
      const currency = converted !== null ? displayCurrency : (s.currency ?? 'RUB');
      const key = `${s.category}__${currency}`;
      if (!totals[key]) totals[key] = { category: s.category, currency, total: 0 };
      totals[key].total += amount;
    }
    return CATEGORIES.flatMap((c) =>
      Object.values(totals).filter((t) => t.category === c),
    );
  }, [activeSubscriptions, convert, displayCurrency]);

  const maxCategoryTotal = useMemo(() => Math.max(1, ...byCategory.map((c) => c.total)), [byCategory]);

  const top3 = useMemo(
    () =>
      [...activeSubscriptions]
        .sort((a, b) => {
          const annualA = toAnnual(splitPrice(a), a.period);
          const annualB = toAnnual(splitPrice(b), b.period);
          const convertedA = convert(annualA, a.currency ?? 'RUB') ?? annualA;
          const convertedB = convert(annualB, b.currency ?? 'RUB') ?? annualB;
          return convertedB - convertedA;
        })
        .slice(0, 3),
    [activeSubscriptions, convert],
  );

  if (activeSubscriptions.length === 0) {
    return (
      <div className="screen stats-screen stats-screen--empty">
        <div className="empty-state">
          <h2>Пока нет данных</h2>
          <p>Статистика появится после добавления подписок</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen stats-screen">
      <button className="btn btn--secondary btn--block" onClick={onOpenYearReview}>
        Итог года 🎉
      </button>

      <section className="stats-section">
        <h2>По категориям, в месяц</h2>
        <div className="category-bars">
          {byCategory.map(({ category, currency, total }) => (
            <div key={`${category}-${currency}`} className="category-bar">
              <div className="category-bar__label">
                <span>{CATEGORY_LABEL[category]}</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
              <div className="category-bar__track">
                <div
                  className="category-bar__fill"
                  style={{ width: `${(total / maxCategoryTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h2>Топ-3 самых дорогих в год</h2>
        <ol className="top-list">
          {top3.map((s) => (
            <li key={s.id} className="top-list__item">
              <span>{s.name}</span>
              <span>{formatMoney(toAnnual(splitPrice(s), s.period), s.currency)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
