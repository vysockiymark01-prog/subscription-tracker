import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { CATEGORIES } from '../storage.js';
import { toMonthly, toAnnual, formatRub, splitPrice } from '../utils/money.js';

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

  const byCategory = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    for (const s of activeSubscriptions) {
      totals[s.category] += toMonthly(splitPrice(s), s.period);
    }
    return CATEGORIES.map((c) => ({ category: c, total: totals[c] })).filter((c) => c.total > 0);
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
          {byCategory.map(({ category, total }) => (
            <div key={category} className="category-bar">
              <div className="category-bar__label">
                <span>{CATEGORY_LABEL[category]}</span>
                <span>{formatRub(total)}</span>
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
              <span>{formatRub(toAnnual(splitPrice(s), s.period))}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
