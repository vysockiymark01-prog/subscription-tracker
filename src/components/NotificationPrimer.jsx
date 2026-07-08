import { useNotifications } from '../context/NotificationsContext.jsx';

export default function NotificationPrimer() {
  const { showPrimer, requestPermission, dismissPrimer } = useNotifications();

  if (!showPrimer) return null;

  return (
    <div className="notification-primer">
      <p>Разреши уведомления, чтобы не пропустить списание и вовремя отменить ненужную подписку</p>
      <div className="notification-primer__actions">
        <button className="btn btn--secondary" onClick={dismissPrimer}>
          Не сейчас
        </button>
        <button className="btn btn--primary" onClick={requestPermission}>
          Разрешить
        </button>
      </div>
    </div>
  );
}
