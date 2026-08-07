import { useNotifications } from '../context/NotificationsContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function NotificationBadge() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const { t } = useLanguage();

  if (!isSupported || permission === 'granted') return null;

  return (
    <div className="notification-badge">
      {permission === 'denied' ? (
        <span>{t('notif.blocked')}</span>
      ) : (
        <>
          <span>{t('notif.off')}</span>
          <button className="notification-badge__action" onClick={requestPermission}>
            {t('notif.allow')}
          </button>
        </>
      )}
    </div>
  );
}
