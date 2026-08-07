import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
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

export default function StatsScreen() {
  const { activeSubscriptions } = useAppData();

  // Группируем по категории и валюте отдельно — суммы в разных валютах не складываются напрямую.
  const byCategory = useMemo(() => {
    const totals = {};
    for (const s of activeSubscriptions) {
      const code = s.currency ?? 'RUB';
      const key = `${s.category}__${code}`;
      if (!totals[key]) totals[key] = { category: s.category, currency: code, total: 0 };
      totals[key].total += toMonthly(splitPrice(s), s.period);
    }
    return CATEGORIES.flatMap((c) =>
      Object.values(totals).filter((t) => t.category === c),
    );
  }, [activeSubscriptions]);

  const maxCategoryTotal = useMemo(() => Math.max(1, ...byCategory.map((c) => c.total)), [byCategory]);

  const top3 = useMemo(
    () =>
      [...activeSubscriptions]
        .sort((a, b) => toAnnual(splitPrice(b), b.period) - toAnnual(splitPrice(a), a.period))
        .slice(0, 3),
    [activeSubscriptions],
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
