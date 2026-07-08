import { useState } from 'react';
import './App.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import NotificationPrimer from './components/NotificationPrimer.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import StatsScreen from './screens/StatsScreen.jsx';
import ArchiveScreen from './screens/ArchiveScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import AddScreen from './screens/AddScreen.jsx';
import DetailScreen from './screens/DetailScreen.jsx';

function AppShell() {
  const [tab, setTab] = useState('home');
  const [overlay, setOverlay] = useState(null);

  const openAdd = () => setOverlay({ type: 'add' });
  const openDetail = (id) => setOverlay({ type: 'detail', id });
  const closeOverlay = () => setOverlay(null);

  return (
    <div className="app-shell">
      <main className="screen-area">
        {tab === 'home' && <HomeScreen onAdd={openAdd} onOpenDetail={openDetail} />}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'archive' && <ArchiveScreen onOpenDetail={openDetail} />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {overlay?.type === 'add' && <AddScreen onClose={closeOverlay} />}
      {overlay?.type === 'detail' && <DetailScreen id={overlay.id} onClose={closeOverlay} />}

      <NotificationPrimer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <NotificationsProvider>
          <AppShell />
        </NotificationsProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
