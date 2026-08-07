import PresetIcon from './PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { daysUntil, formatDaysUntil } from '../utils/dates.js';
import { formatMoney, splitPrice } from '../utils/money.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function SubscriptionCard({ subscription, onClick }) {
  const { t, tp } = useLanguage();
  const icon = getIconFor(subscription);
  const soon = subscription.status === 'active' && daysUntil(subscription.nextPaymentDate) <= 3;
  const isSplit = subscription.splitCount > 1;

  return (
    <button className={`subscription-card${soon ? ' subscription-card--soon' : ''}`} onClick={onClick}>
      <PresetIcon color={icon.color} letter={icon.letter} />
      <div className="subscription-card__info">
        <div className="subscription-card__name">{subscription.name}</div>
        <div className="subscription-card__meta">
          {formatMoney(subscription.price, subscription.currency)} / {t(`period.${subscription.period}.short`)}
          {isSplit && ` · ${t('subscriptionCard.splitShare')} ${formatMoney(splitPrice(subscription), subscription.currency)}`}
        </div>
      </div>
      <div className="subscription-card__due">{formatDaysUntil(subscription.nextPaymentDate, t, tp)}</div>
    </button>
  );
}
