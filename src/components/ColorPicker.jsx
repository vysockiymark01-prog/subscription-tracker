import { ICON_COLORS } from '../data/presets.js';

/**
 * Палитра кружков для выбора цвета иконки подписки. value === '' означает
 * "цвет по умолчанию" (из пресета или высчитанный по названию).
 */
export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      <button
        type="button"
        className={`color-picker__swatch color-picker__swatch--auto${!value ? ' color-picker__swatch--active' : ''}`}
        onClick={() => onChange('')}
        aria-label="Цвет по умолчанию"
      >
        ?
      </button>
      {ICON_COLORS.map((color) => (
        <button
          type="button"
          key={color}
          className={`color-picker__swatch${value === color ? ' color-picker__swatch--active' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
    </div>
  );
}
