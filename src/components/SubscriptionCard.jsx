import { useRef, useState } from 'react';
import PresetIcon from './PresetIcon.jsx';
import { getIconFor } from '../data/presets.js';
import { daysUntil, formatDaysUntil } from '../utils/dates.js';
import { formatMoney, splitPrice } from '../utils/money.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { vibrate } from '../utils/haptics.js';

const OPEN_X = -76;
const DRAG_THRESHOLD = 6;

/**
 * Карточка подписки. Если передан onSwipeArchive — карточку можно свайпнуть
 * влево, чтобы открыть кнопку быстрого архивирования, без захода в детали.
 */
export default function SubscriptionCard({ subscription, onClick, onSwipeArchive }) {
  const { t, tp } = useLanguage();
  const icon = getIconFor(subscription);
  const soon = subscription.status === 'active' && daysUntil(subscription.nextPaymentDate) <= 3;
  const isSplit = subscription.splitCount > 1;

  const [dragX, setDragX] = useState(0);
  const drag = useRef(null); // { startClientX, baseX, moved, openedVibrated }

  const swipable = Boolean(onSwipeArchive);

  function handlePointerDown(e) {
    if (!swipable) return;
    drag.current = { startClientX: e.clientX, baseX: dragX, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!swipable || !drag.current) return;
    const delta = e.clientX - drag.current.startClientX;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.current.moved = true;
    const next = Math.min(0, Math.max(OPEN_X, drag.current.baseX + delta));
    setDragX(next);
  }

  function endDrag() {
    if (!swipable || !drag.current) return;
    const wasOpen = dragX <= OPEN_X / 2;
    setDragX(wasOpen ? OPEN_X : 0);
    if (wasOpen && dragX !== OPEN_X) vibrate(10);
    drag.current = null;
  }

  function handleCardClick(e) {
    if (dragX !== 0) {
      // Карточка открыта свайпом — тап по ней закрывает панель, а не открывает детали.
      e.preventDefault();
      setDragX(0);
      return;
    }
    onClick?.();
  }

  function handleArchiveClick() {
    vibrate();
    setDragX(0);
    onSwipeArchive(subscription.id);
  }

  return (
    <div className="subscription-card-wrap">
      {swipable && (
        <button
          className="subscription-card__swipe-action"
          style={{ width: -OPEN_X }}
          onClick={handleArchiveClick}
          aria-label={t('home.swipeArchive')}
        >
          {t('home.swipeArchive')}
        </button>
      )}
      <button
        className={`subscription-card${soon ? ' subscription-card--soon' : ''}`}
        style={swipable ? { transform: `translateX(${dragX}px)`, touchAction: 'pan-y' } : undefined}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <PresetIcon color={icon.color} letter={icon.letter} emoji={icon.emoji} />
        <div className="subscription-card__info">
          <div className="subscription-card__name">{subscription.name}</div>
          <div className="subscription-card__meta">
            {formatMoney(subscription.price, subscription.currency)} / {t(`period.${subscription.period}.short`)}
            {isSplit && ` · ${t('subscriptionCard.splitShare')} ${formatMoney(splitPrice(subscription), subscription.currency)}`}
          </div>
        </div>
        <div className="subscription-card__due">{formatDaysUntil(subscription.nextPaymentDate, t, tp)}</div>
      </button>
    </div>
  );
}
