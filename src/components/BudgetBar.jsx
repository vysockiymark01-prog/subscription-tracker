import { useMemo, useState } from 'react';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getMonthlyBudget } from '../storage.js';
import { monthlyCost, formatMoney } from '../utils/money.js';

/**
 * Полоска «Бюджет на месяц»: сколько из заданного лимита занимают активные
 * подписки (в среднем в месяц, разовые — только в месяц своего платежа).
 * Подписки в других валютах пересчитываются по курсу ЦБ; если курса нет —
 * полоску не показываем, чтобы не врать неполной суммой.
 */
export default function BudgetBar({ subscriptions }) {
  const { convertTo } = useExchangeRate();
  const { t } = useLanguage();
  const [budget] = useState(() => getMonthlyBudget());

  const spent = useMemo(() => {
    if (!budget) return null;
    let sum = 0;
    for (const s of subscriptions) {
      const amount = monthlyCost(s);
      if (amount === 0) continue;
      const converted = convertTo(amount, s.currency ?? 'RUB', budget.currency);
      if (converted === null) return null;
      sum += converted;
    }
    return sum;
  }, [budget, subscriptions, convertTo]);

  if (!budget || spent === null) return null;

  const ratio = spent / budget.amount;
  const over = spent > budget.amount;

  return (
    <div className={`budget-bar${over ? ' budget-bar--over' : ''}`}>
      <div className="budget-bar__label">
        <span>{t('budget.title')}</span>
        <span>
          {formatMoney(spent, budget.currency)} / {formatMoney(budget.amount, budget.currency)}
        </span>
      </div>
      <div className="budget-bar__track">
        <div className="budget-bar__fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      {over && (
        <div className="budget-bar__warning">
          {t('budget.over', { amount: formatMoney(spent - budget.amount, budget.currency) })}
        </div>
      )}
    </div>
  );
}
