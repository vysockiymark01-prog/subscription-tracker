import { useEffect, useState } from 'react';
import './App.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { ExchangeRateProvider } from './context/ExchangeRateContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import NotificationPrimer from './components/NotificationPrimer.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import ArchiveScreen from './screens/ArchiveScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AddScreen from './screens/AddScreen.jsx';
import DetailScreen from './screens/DetailScreen.jsx';
import YearReviewScreen from './screens/YearReviewScreen.jsx';
import OnboardingScreen from './screens/OnboardingScreen.jsx';
import LockScreen from './screens/LockScreen.jsx';
import * as storage from './storage.js';

function AppShell() {
  const [tab, setTabState] = useState(() => storage.getLastTab());
  const [overlay, setOverlay] = useState(null);

  // Оборачиваем setState, чтобы выбор вкладки сразу сохранялся — иначе
  // обновление страницы (F5, перезапуск PWA) всегда сбрасывало на главную.
  function setTab(next) {
    setTabState(next);
    storage.setLastTab(next);
  }

  const openAdd = () => setOverlay({ type: 'add' });
  const openDetail = (id) => setOverlay({ type: 'detail', id });
  const openYearReview = () => setOverlay({ type: 'year-review' });
  const closeOverlay = () => setOverlay(null);

  // Обработка ярлыков приложения (долгое нажатие на иконку на Android):
  // ?action=add открывает добавление подписки, ?screen=calendar сразу открывает
  // вкладку календаря. Один раз при монтировании, дальше чистим URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const screen = params.get('screen');
    if (action === 'add') setOverlay({ type: 'add' });
    if (['home', 'stats', 'calendar', 'archive', 'settings'].includes(screen)) setTab(screen);
    if (action || screen) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <div className="app-shell">
      <main className="screen-area">
        {tab === 'home' && <HomeScreen onAdd={openAdd} onOpenDetail={openDetail} />}
        {tab === 'stats' && <StatsScreen onOpenYearReview={openYearReview} />}
        {tab === 'calendar' && <CalendarScreen />}
        {tab === 'archive' && <ArchiveScreen onOpenDetail={openDetail} />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {overlay?.type === 'add' && <AddScreen onClose={closeOverlay} />}
      {overlay?.type === 'detail' && <DetailScreen id={overlay.id} onClose={closeOverlay} />}
      {overlay?.type === 'year-review' && <YearReviewScreen onClose={closeOverlay} />}

      <NotificationPrimer />
    </div>
  );
}

// Ворота перед основным приложением: сначала код/биометрия (если включены в
// настройках), затем — для совсем новых пользователей — короткий онбординг.
function Gate() {
  const [unlocked, setUnlocked] = useState(() => !storage.isAppLockEnabled());
  const [onboarded, setOnboarded] = useState(() => storage.isOnboardingCompleted());

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }
  if (!onboarded) {
    return <OnboardingScreen onDone={() => setOnboarded(true)} />;
  }
  return <AppShell />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppDataProvider>
          <NotificationsProvider>
            <ExchangeRateProvider>
              <Gate />
            </ExchangeRateProvider>
          </NotificationsProvider>
        </AppDataProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
