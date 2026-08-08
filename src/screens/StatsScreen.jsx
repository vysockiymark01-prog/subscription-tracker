import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { CATEGORIES } from '../storage.js';
import { getIconFor } from '../data/presets.js';
import { toMonthly, formatMoney, splitPrice, sumConverted } from '../utils/money.js';
import { getLifetimeSpend } from '../utils/insights.js';

const LOCALE_TAGS = { ru: 'ru-RU', kk: 'kk-KZ', uk: 'uk-UA', be: 'be-BY', uz: 'uz-UZ' };

export default function StatsScreen({ onOpenYearReview }) {
  const { activeSubscriptions, subscriptions } = useAppData();
  const { convert, displayCurrency } = useExchangeRate();
  const { t, language } = useLanguage();

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
      Object.values(totals).filter((t2) => t2.category === c),
    );
  }, [activeSubscriptions, convert, displayCurrency]);

  const maxCategoryTotal = useMemo(() => Math.max(1, ...byCategory.map((c) => c.total)), [byCategory]);

  // Все подписки, отсортированные по стоимости в месяц (по убыванию) — данные для графика.
  const costRanking = useMemo(() => {
    return [...activeSubscriptions]
      .map((s) => {
        const monthly = toMonthly(splitPrice(s), s.period);
        const converted = convert(monthly, s.currency ?? 'RUB');
        return {
          id: s.id,
          name: s.name,
          amount: converted ?? monthly,
          currency: converted !== null ? displayCurrency : (s.currency ?? 'RUB'),
          color: getIconFor(s).color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [activeSubscriptions, convert, displayCurrency]);

  const maxCost = useMemo(() => Math.max(1, ...costRanking.map((r) => r.amount)), [costRanking]);

  // Тренд общих расходов по месяцам: считаем по истории цены каждой подписки —
  // на каждый месяц, где что-то менялось, берём последнюю известную на тот момент
  // цену и суммируем по всем подпискам, ещё не отменённым к этому месяцу.
  // Валюта: пытаемся конвертировать в выбранную для отображения, иначе складываем как есть.
  const trend = useMemo(() => {
    const monthsSet = new Set();
    for (const s of subscriptions) {
      for (const h of s.priceHistory ?? []) {
        monthsSet.add(h.date.slice(0, 7));
      }
    }
    const months = [...monthsSet].sort().slice(-12);

    return months.map((month) => {
      let total = 0;
      for (const s of subscriptions) {
        const history = s.priceHistory ?? [];
        const applicable = [...history].reverse().find((h) => h.date.slice(0, 7) <= month);
        if (!applicable) continue;
        if (s.cancelledAt && s.cancelledAt.slice(0, 7) < month) continue;
        const splitCount = s.splitCount > 0 ? s.splitCount : 1;
        const monthly = toMonthly(applicable.price / splitCount, s.period);
        const converted = convert(monthly, s.currency ?? 'RUB');
        total += converted ?? monthly;
      }
      const label = new Date(`${month}-01T00:00:00`).toLocaleDateString(LOCALE_TAGS[language] ?? 'ru-RU', {
        month: 'short',
        year: '2-digit',
      });
      return { month, label, total };
    });
  }, [subscriptions, convert, language]);

  const maxTrend = useMemo(() => Math.max(1, ...trend.map((m) => m.total)), [trend]);

  const lifetimeSpendByCurrency = useMemo(() => getLifetimeSpend(subscriptions), [subscriptions]);
  const lifetimeSpendConverted = useMemo(
    () => sumConverted(lifetimeSpendByCurrency, convert),
    [lifetimeSpendByCurrency, convert],
  );

  if (activeSubscriptions.length === 0) {
    return (
      <div className="screen stats-screen stats-screen--empty">
        <div className="empty-state">
          <h2>{t('stats.empty.title')}</h2>
          <p>{t('stats.empty.text')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen stats-screen">
      <button className="btn btn--secondary btn--block" onClick={onOpenYearReview}>
        {t('stats.yearReview')}
      </button>

      {lifetimeSpendByCurrency.length > 0 && (
        <div className="stats-lifetime">
          <div className="stats-lifetime__label">{t('stats.lifetimeSpend')}</div>
          <div className="stats-lifetime__value">
            {lifetimeSpendConverted !== null
              ? formatMoney(lifetimeSpendConverted, displayCurrency)
              : lifetimeSpendByCurrency.map(([code, total]) => formatMoney(total, code)).join(' + ')}
          </div>
        </div>
      )}

      <section className="stats-section">
        <h2>{t('stats.byCategory')}</h2>
        <div className="category-bars">
          {byCategory.map(({ category, currency, total }) => (
            <div key={`${category}-${currency}`} className="category-bar">
              <div className="category-bar__label">
                <span>{t(`category.${category}`)}</span>
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
        <h2>{t('stats.byCost')}</h2>
        <div className="category-bars">
          {costRanking.map((r) => (
            <div key={r.id} className="category-bar">
              <div className="category-bar__label">
                <span>{r.name}</span>
                <span>{formatMoney(r.amount, r.currency)}</span>
              </div>
              <div className="category-bar__track">
                <div
                  className="category-bar__fill"
                  style={{ width: `${(r.amount / maxCost) * 100}%`, background: r.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h2>{t('stats.trend')}</h2>
        {trend.length < 2 ? (
          <p className="settings-hint">{t('stats.trend.empty')}</p>
        ) : (
          <>
            <p className="settings-hint">
              {formatMoney(Math.min(...trend.map((m) => m.total)), displayCurrency !== 'grouped' ? displayCurrency : 'RUB')}
              {' – '}
              {formatMoney(Math.max(...trend.map((m) => m.total)), displayCurrency !== 'grouped' ? displayCurrency : 'RUB')}
            </p>
            <div className="trend-chart">
              {trend.map((m) => (
                <div key={m.month} className="trend-chart__col">
                  <div className="trend-chart__bar-track">
                    <div
                      className="trend-chart__bar"
                      style={{ height: `${Math.max(4, (m.total / maxTrend) * 100)}%` }}
                    />
                  </div>
                  <div className="trend-chart__label">{m.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
