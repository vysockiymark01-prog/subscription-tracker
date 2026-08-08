export default function PresetIcon({ color, letter, emoji, size = 44 }) {
  return (
    <div
      className="preset-icon"
      style={{ width: size, height: size, background: color, fontSize: size * (emoji ? 0.52 : 0.42) }}
    >
      {emoji || letter}
    </div>
  );
}
