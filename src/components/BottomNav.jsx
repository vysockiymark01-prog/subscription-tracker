import { useLanguage } from '../context/LanguageContext.jsx';

const TABS = [
  { id: 'home', key: 'nav.home' },
  { id: 'stats', key: 'nav.stats' },
  { id: 'calendar', key: 'nav.calendar' },
  { id: 'archive', key: 'nav.archive' },
  { id: 'settings', key: 'nav.settings' },
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
          {t(tab.key)}
        </button>
      ))}
    </nav>
  );
}
