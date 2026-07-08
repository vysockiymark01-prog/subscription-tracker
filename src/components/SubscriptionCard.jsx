import PresetIcon from './PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { daysUntil, formatDaysUntil } from '../utils/dates.js';
import { formatRub, splitPrice } from '../utils/money.js';

const PERIOD_LABEL = { week: 'нед', month: 'мес', quarter: 'кв', year: 'год' };

export default function SubscriptionCard({ subscription, onClick }) {
  const icon = getIconFor(subscription);
  const soon = subscription.status === 'active' && daysUntil(subscription.nextPaymentDate) <= 3;
  const isSplit = subscription.splitCount > 1;

  return (
    <button className={`subscription-card${soon ? ' subscription-card--soon' : ''}`} onClick={onClick}>
      <PresetIcon color={icon.color} letter={icon.letter} />
      <div className="subscription-card__info">
        <div className="subscription-card__name">{subscription.name}</div>
        <div className="subscription-card__meta">
          {formatRub(subscription.price)} / {PERIOD_LABEL[subscription.period]}
          {isSplit && ` · моя доля ${formatRub(splitPrice(subscription))}`}
        </div>
      </div>
      <div className="subscription-card__due">{formatDaysUntil(subscription.nextPaymentDate)}</div>
    </button>
  );
}
