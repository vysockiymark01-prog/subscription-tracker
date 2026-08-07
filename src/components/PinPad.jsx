import { useState } from 'react';

/**
 * Клавиатура для ввода PIN-кода фиксированной длины. Не хранит и не проверяет
 * сам код — просто собирает N цифр и отдаёт их родителю через onComplete.
 */
export default function PinPad({ length = 4, onComplete, error }) {
  const [value, setValue] = useState('');

  function press(digit) {
    if (value.length >= length) return;
    const next = value + digit;
    setValue(next);
    if (next.length === length) {
      onComplete(next);
      setValue('');
    }
  }

  function backspace() {
    setValue((v) => v.slice(0, -1));
  }

  return (
    <div className="pin-pad">
      <div className="pin-pad__dots">
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={`pin-pad__dot${i < value.length ? ' pin-pad__dot--filled' : ''}`} />
        ))}
      </div>
      {error && <p className="pin-pad__error">{error}</p>}
      <div className="pin-pad__keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button type="button" key={d} className="pin-pad__key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <span />
        <button type="button" className="pin-pad__key" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="pin-pad__key pin-pad__key--action" onClick={backspace} aria-label="⌫">
          ⌫
        </button>
      </div>
    </div>
  );
}
