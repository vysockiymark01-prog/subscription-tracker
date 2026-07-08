const TABS = [
  { id: 'home', label: 'Главная' },
  { id: 'stats', label: 'Статистика' },
  { id: 'archive', label: 'Архив' },
  { id: 'settings', label: 'Настройки' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav__item${active === tab.id ? ' bottom-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
