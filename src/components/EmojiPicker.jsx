import { ICON_EMOJIS } from '../data/presets.js';

/**
 * Набор эмодзи для иконки подписки вместо буквы. value === '' означает
 * "без эмодзи" (буква из названия или пресета).
 */
export default function EmojiPicker({ value, onChange }) {
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
      {ICON_EMOJIS.map((emoji) => (
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
  );
}
