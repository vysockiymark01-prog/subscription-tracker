/* Дополнение к service worker (подключается через workbox importScripts).
 * Фоновые уведомления: браузер периодически будит service worker
 * (Periodic Background Sync), а тот показывает уведомления, запланированные
 * страницей на сегодня. Расписание страница кладёт в Cache Storage —
 * localStorage service worker не видит. */

const SCHEDULE_CACHE = 'notif-schedule';

function localTodayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

async function readJson(cache, key, fallback) {
  const res = await cache.match(key);
  if (!res) return fallback;
  try {
    return await res.json();
  } catch {
    return fallback;
  }
}

async function runScheduledCheck() {
  const cache = await caches.open(SCHEDULE_CACHE);
  const schedule = await readJson(cache, 'schedule.json', null);
  if (!schedule || !Array.isArray(schedule.items)) return;
  const shown = await readJson(cache, 'shown.json', []);
  const today = localTodayIso();
  let changed = false;
  for (const item of schedule.items) {
    if (item.date !== today || shown.includes(item.tag)) continue;
    await self.registration.showNotification(item.title, {
      body: item.body,
      tag: item.tag,
      icon: 'pwa-192x192.png',
    });
    shown.push(item.tag);
    changed = true;
  }
  if (changed) {
    await cache.put('shown.json', new Response(JSON.stringify(shown.slice(-300))));
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-check') event.waitUntil(runScheduledCheck());
});

// Нажатие на уведомление открывает приложение (или переключает на уже открытое).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
