import { useMemo, useState } from 'react';
import {
  getDuplicateCategoryTips,
  getPriceIncreaseTips,
  getStaleSubscriptionTips,
  shouldRemindBackup,
} from '../utils/insights.js';
import { formatMoney } from '../utils/money.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import * as storage from '../storage.js';

/**
 * Ненавязчивая подборка из 1-3 наблюдений по активным подпискам: рост цены,
 * похожие подписки в одной категории, давно не пересматривавшиеся подписки,
 * напоминание про бэкап. Считается локально по уже имеющимся данным.
 */
export default function SmartTips({ subscriptions }) {
  const [dismissedIds, setDismissedIds] = useState(() => storage.getDismissedTipIds());
  const { t, tp } = useLanguage();

  const allItems = useMemo(() => {
    const priceTips = getPriceIncreaseTips(subscriptions);
    const dupTips = getDuplicateCategoryTips(subscriptions);
    const staleTips = getStaleSubscriptionTips(subscriptions);
    const backupDue = shouldRemindBackup(storage.getBackupReminderDays(), storage.getLastExportAt());

    const list = [];
    if (backupDue) {
      // В id зашит последний экспорт, чтобы после нового бэкапа подсказка не
      // осталась скрытой навсегда — это будет уже новый повод напомнить.
      list.push({ id: `backup-${storage.getLastExportAt() ?? 'never'}`, text: t('tips.backup') });
    }
    for (const tItem of priceTips.slice(0, 2)) {
      list.push({
        id: `price-${tItem.name}`,
        text: t('tips.priceIncrease', {
          name: tItem.name,
          from: formatMoney(tItem.from, tItem.currency),
          to: formatMoney(tItem.to, tItem.currency),
        }),
      });
    }
    for (const dItem of dupTips.slice(0, 1)) {
      list.push({
        id: `dup-${dItem.category}`,
        text: t('tips.duplicate', {
          count: dItem.count,
          category: t(`category.${dItem.category}`),
          names: dItem.names.join(', '),
        }),
      });
    }
    if (staleTips.length > 0) {
      // В id зашит набор конкретных подписок — если он изменится (появится
      // новая «зависшая» или старую поправят), это будет новый повод напомнить.
      const key = staleTips
        .map((s) => s.id)
        .sort()
        .join(',');
      list.push({ id: `stale-${key}`, text: tp('tips.stale', staleTips.length) });
    }
    return list.slice(0, 3);
  }, [subscriptions, t, tp]);

  const items = useMemo(
    () => allItems.filter((tip) => !dismissedIds.includes(tip.id)),
    [allItems, dismissedIds],
  );

  if (items.length === 0) return null;

  function handleDismiss() {
    const ids = items.map((tip) => tip.id);
    storage.addDismissedTipIds(ids);
    setDismissedIds((prev) => [...new Set([...prev, ...ids])]);
  }

  return (
    <div className="smart-tips">
      {items.map((tip) => (
        <div key={tip.id} className="smart-tips__item">
          {tip.text}
        </div>
      ))}
      <button className="smart-tips__dismiss" onClick={handleDismiss}>
        {t('tips.hide')}
      </button>
    </div>
  );
}
