export default function PresetIcon({ color, letter, size = 44 }) {
  return (
    <div
      className="preset-icon"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {letter}
    </div>
  );
}
