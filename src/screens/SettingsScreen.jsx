import { useRef, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { todayISO } from '../utils/dates.js';

const THEME_OPTIONS = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { exportData, importData, importCsv } = useAppData();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `подписки-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (isCsv) {
          const created = importCsv(String(reader.result));
          setMessage({ type: 'success', text: `Импортировано подписок: ${created.length}` });
        } else {
          importData(String(reader.result));
          setMessage({ type: 'success', text: 'Данные успешно импортированы' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Не удалось прочитать файл: неверный формат' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="screen settings-screen">
      <section className="settings-section">
        <h2>Тема</h2>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`theme-option${theme === opt.value ? ' theme-option--active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Данные</h2>
        <p className="settings-hint">Все данные хранятся только на этом устройстве. Экспортируй их, чтобы не потерять.</p>
        <button className="btn btn--secondary btn--block" onClick={handleExport}>
          Экспортировать в JSON
        </button>
        <button className="btn btn--secondary btn--block" onClick={handleImportClick}>
          Импортировать из файла (JSON или CSV)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json,.csv,text/csv"
          className="visually-hidden"
          onChange={handleFileChange}
        />
        {message && <p className={`settings-message settings-message--${message.type}`}>{message.text}</p>}
      </section>

      <section className="settings-section">
        <button className="btn btn--secondary btn--block" onClick={() => setShowAbout((v) => !v)}>
          О приложении
        </button>
        {showAbout && (
          <p className="settings-hint">
            Трекер подписок — приложение для учёта платных подписок и напоминаний о списаниях. Никакого доступа к
            банкам, все данные хранятся локально на вашем устройстве.
          </p>
        )}
      </section>
    </div>
  );
}
