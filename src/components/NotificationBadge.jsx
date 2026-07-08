import { useNotifications } from '../context/NotificationsContext.jsx';

export default function NotificationBadge() {
  const { permission, isSupported, requestPermission } = useNotifications();

  if (!isSupported || permission === 'granted') return null;

  return (
    <div className="notification-badge">
      {permission === 'denied' ? (
        <span>Уведомления заблокированы в настройках браузера — не пропусти списание вручную</span>
      ) : (
        <>
          <span>Уведомления выключены</span>
          <button className="notification-badge__action" onClick={requestPermission}>
            Разрешить
          </button>
        </>
      )}
    </div>
  );
}
