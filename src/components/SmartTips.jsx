import { useMemo, useState } from 'react';
import { getDuplicateCategoryTips, getPriceIncreaseTips, getStaleSubscriptionTips } from '../utils/insights.js';
import { formatMoney } from '../utils/money.js';

const CATEGORY_LABEL = {
  video: 'Видео',
  music: 'Музыка',
  software: 'Софт',
  games: 'Игры',
  education: 'Образование',
  other: 'Другое',
};

/**
 * Ненавязчивая подборка из 1-3 наблюдений по активным подпискам: рост цены,
 * похожие подписки в одной категории, давно не пересматривавшиеся подписки.
 * Считается локально по уже имеющимся данным, без ИИ и сети.
 */
export default function SmartTips({ subscriptions }) {
  const [dismissed, setDismissed] = useState(false);

  const items = useMemo(() => {
    const priceTips = getPriceIncreaseTips(subscriptions);
    const dupTips = getDuplicateCategoryTips(subscriptions);
    const staleTips = getStaleSubscriptionTips(subscriptions);

    const list = [];
    for (const t of priceTips.slice(0, 2)) {
      list.push({
        id: `price-${t.name}`,
        text: `«${t.name}» подорожал: ${formatMoney(t.from, t.currency)} → ${formatMoney(t.to, t.currency)}`,
      });
    }
    for (const t of dupTips.slice(0, 1)) {
      list.push({
        id: `dup-${t.category}`,
        text: `У вас ${t.count} подписки в категории «${CATEGORY_LABEL[t.category]}»: ${t.names.join(', ')} — возможно, часть можно отменить`,
      });
    }
    if (staleTips.length > 0) {
      list.push({
        id: 'stale',
        text: `${staleTips.length} ${staleTips.length === 1 ? 'подписка не пересматривалась' : 'подписок не пересматривались'} давно — загляните, всё ещё нужны?`,
      });
    }
    return list.slice(0, 3);
  }, [subscriptions]);

  if (items.length === 0 || dismissed) return null;

  return (
    <div className="smart-tips">
      {items.map((tip) => (
        <div key={tip.id} className="smart-tips__item">
          {tip.text}
        </div>
      ))}
      <button className="smart-tips__dismiss" onClick={() => setDismissed(true)}>
        Скрыть
      </button>
    </div>
  );
}
