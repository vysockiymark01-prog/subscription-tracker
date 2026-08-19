import { useLanguage } from '../context/LanguageContext.jsx';

const TABS = [
  { id: 'home', key: 'nav.home', icon: '🏠' },
  { id: 'stats', key: 'nav.stats', icon: '📊' },
  { id: 'calendar', key: 'nav.calendar', icon: '📅' },
  { id: 'reminders', key: 'nav.reminders', icon: '⏰' },
  { id: 'archive', key: 'nav.archive', icon: '🗄️' },
  { id: 'settings', key: 'nav.settings', icon: '⚙️' },
];

export default function BottomNav({ active, onChange }) {
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav__item${active === tab.id ? ' bottom-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="bottom-nav__label">{t(tab.key)}</span>
        </button>
      ))}
    </nav>
  );
}
