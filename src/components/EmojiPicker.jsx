import { EMOJI_CATEGORIES } from '../data/presets.js';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Набор эмодзи для иконки подписки/напоминания вместо буквы. value === ''
 * означает "без эмодзи" (буква из названия или пресета). Эмодзи сгруппированы
 * по темам — список длинный, без разбивки в нём сложно ориентироваться.
 */
export default function EmojiPicker({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="emoji-picker">
      <button
        type="button"
        className={`emoji-picker__item emoji-picker__item--auto${!value ? ' emoji-picker__item--active' : ''}`}
        onClick={() => onChange('')}
        aria-label="Без эмодзи"
      >
        Aa
      </button>
      {EMOJI_CATEGORIES.map((cat) => (
        <div key={cat.key} className="emoji-picker__group">
          <div className="emoji-picker__group-label">{t(`emojiPicker.category.${cat.key}`)}</div>
          <div className="emoji-picker__group-items">
            {cat.emojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                className={`emoji-picker__item${value === emoji ? ' emoji-picker__item--active' : ''}`}
                onClick={() => onChange(emoji)}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
