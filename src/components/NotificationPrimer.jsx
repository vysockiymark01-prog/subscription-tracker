import { useNotifications } from '../context/NotificationsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function NotificationPrimer() {
  const { showPrimer, requestPermission, dismissPrimer } = useNotifications();
  const { t } = useLanguage();

  if (!showPrimer) return null;

  return (
    <div className="notification-primer">
      <p>{t('notif.primerText')}</p>
      <div className="notification-primer__actions">
        <button className="btn btn--secondary" onClick={dismissPrimer}>
          {t('notif.notNow')}
        </button>
        <button className="btn btn--primary" onClick={requestPermission}>
          {t('notif.allow')}
        </button>
      </div>
    </div>
  );
}
