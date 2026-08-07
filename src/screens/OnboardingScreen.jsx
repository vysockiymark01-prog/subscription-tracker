import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { PRESETS } from '../data/presets.js';
import { todayISO } from '../utils/dates.js';
import PresetIcon from '../components/PresetIcon.jsx';
import * as storage from '../storage.js';

// Небольшая подборка самых узнаваемых сервисов для быстрого старта —
// полный каталог остаётся доступным потом через обычное добавление подписки.
const FEATURED_IDS = [
  'yandex-plus', 'netflix', 'spotify', 'youtube-premium', 'apple-music', 'telegram-premium',
  'kinopoisk', 'ozon-premium', 'chatgpt-plus', 'icloud', 'vk-music', 'sberprime',
];

const FEATURED_PRESETS = FEATURED_IDS.map((id) => PRESETS.find((p) => p.id === id)).filter(Boolean);

export default function OnboardingScreen({ onDone }) {
  const { addSubscription } = useAppData();
  const { t } = useLanguage();
  const [selected, setSelected] = useState(() => new Set());

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function finish() {
    for (const preset of FEATURED_PRESETS) {
      if (!selected.has(preset.id)) continue;
      addSubscription({
        name: preset.name,
        price: preset.price,
        category: preset.category,
        period: 'month',
        currency: 'RUB',
        nextPaymentDate: todayISO(),
        iconKey: preset.id,
      });
    }
    storage.setOnboardingCompleted();
    onDone();
  }

  return (
    <div className="onboarding-screen">
      <h1 className="onboarding-screen__title">{t('onboarding.welcome')}</h1>
      <p className="onboarding-screen__subtitle">{t('onboarding.subtitle')}</p>

      <div className="preset-grid onboarding-screen__grid">
        {FEATURED_PRESETS.map((preset) => {
          const isSelected = selected.has(preset.id);
          return (
            <button
              key={preset.id}
              className={`preset-grid__item onboarding-screen__preset${isSelected ? ' onboarding-screen__preset--selected' : ''}`}
              onClick={() => toggle(preset.id)}
            >
              <div className="onboarding-screen__icon-wrap">
                <PresetIcon color={preset.color} letter={preset.letter} />
                {isSelected && <span className="onboarding-screen__check">✓</span>}
              </div>
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      <button className="btn btn--primary btn--block" onClick={finish}>
        {selected.size > 0
          ? t('onboarding.addSelected.some', { count: selected.size })
          : t('onboarding.addSelected.zero')}
      </button>
    </div>
  );
}
