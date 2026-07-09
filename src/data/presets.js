// Каталог популярных подписок для быстрого добавления.
// Цены типовые — пользователь может изменить их при добавлении подписки.

export const PRESETS = [
  { id: 'yandex-plus', name: 'Яндекс Плюс', price: 399, category: 'other', color: '#FFCC00', letter: 'Я', cancelUrl: 'https://plus.yandex.ru', cancelHint: 'Управление подпиской — в настройках аккаунта Яндекс' },
  { id: 'kinopoisk', name: 'Кинопоиск', price: 299, category: 'video', color: '#FF3D00', letter: 'К', cancelUrl: 'https://www.kinopoisk.ru', cancelHint: 'Управление подпиской — в настройках аккаунта Яндекс' },
  { id: 'vk-music', name: 'VK Музыка', price: 169, category: 'music', color: '#0077FF', letter: 'V', cancelUrl: 'https://vk.com/music', cancelHint: 'Настройки → Подписки VK Донат/Музыка' },
  { id: 'ozon-premium', name: 'Озон Premium', price: 199, category: 'other', color: '#005BFF', letter: 'O', cancelUrl: 'https://www.ozon.ru/premium', cancelHint: 'Личный кабинет → Ozon Premium → Управление подпиской' },
  { id: 'sberprime', name: 'СберПрайм', price: 199, category: 'other', color: '#21A038', letter: 'C', cancelUrl: 'https://www.sberbank.ru/prime', cancelHint: 'Приложение СберБанк Онлайн → СберПрайм' },
  { id: 'telegram-premium', name: 'Telegram Premium', price: 399, category: 'software', color: '#26A5E4', letter: 'T', cancelUrl: 'https://telegram.org', cancelHint: 'В приложении Telegram: Настройки → Telegram Premium' },
  { id: 'litres', name: 'ЛитРес', price: 299, category: 'other', color: '#F58220', letter: 'Л', cancelUrl: 'https://www.litres.ru', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'wink', name: 'Wink', price: 249, category: 'video', color: '#7B2FF7', letter: 'W', cancelUrl: 'https://wink.ru', cancelHint: 'Личный кабинет → Подписки' },
  { id: 'okko', name: 'Okko', price: 299, category: 'video', color: '#00D26A', letter: 'O', cancelUrl: 'https://okko.tv', cancelHint: 'Личный кабинет → Подписки' },
  { id: 'ivi', name: 'IVI', price: 399, category: 'video', color: '#FF8A00', letter: 'I', cancelUrl: 'https://www.ivi.ru', cancelHint: 'Личный кабинет → Подписки' },
  { id: 'start', name: 'START', price: 399, category: 'video', color: '#E8001C', letter: 'S', cancelUrl: 'https://start.ru', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'premier', name: 'Premier', price: 399, category: 'video', color: '#8B00FF', letter: 'P', cancelUrl: 'https://premier.one', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'mts-premium', name: 'МТС Premium', price: 399, category: 'other', color: '#E30611', letter: 'М', cancelUrl: 'https://premium.mts.ru', cancelHint: 'Личный кабинет МТС → Подписки' },
  { id: 'youtube-premium', name: 'YouTube Premium', price: 399, category: 'video', color: '#FF0000', letter: 'Y', cancelUrl: 'https://www.youtube.com/paid_memberships', cancelHint: 'YouTube → Платные подписки' },
  { id: 'spotify', name: 'Spotify', price: 169, category: 'music', color: '#1DB954', letter: 'S', cancelUrl: 'https://www.spotify.com/account/subscription/', cancelHint: 'Аккаунт → Подписка' },
  { id: 'icloud', name: 'iCloud', price: 79, category: 'software', color: '#3693F3', letter: 'i', cancelUrl: 'https://appleid.apple.com', cancelHint: 'Настройки iPhone → Apple ID → Подписки' },
  { id: 'netflix', name: 'Netflix', price: 799, category: 'video', color: '#E50914', letter: 'N', cancelUrl: 'https://www.netflix.com/youraccount', cancelHint: 'Аккаунт → Управление подпиской' },
  { id: 'kion', name: 'KION', price: 299, category: 'video', color: '#8C1EFF', letter: 'K', cancelUrl: 'https://kion.ru', cancelHint: 'Личный кабинет → Подписки' },
  { id: 'amediateka', name: 'Amediateka', price: 399, category: 'video', color: '#A6192E', letter: 'A', cancelUrl: 'https://www.amediateka.ru', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'kaspersky-premium', name: 'Kaspersky Premium', price: 349, category: 'software', color: '#00A650', letter: 'K', cancelUrl: 'https://my.kaspersky.com', cancelHint: 'Мой Kaspersky → Подписки' },
  { id: 'yandex-360', name: 'Яндекс 360', price: 199, category: 'software', color: '#FFCC00', letter: '3', cancelUrl: 'https://360.yandex.ru', cancelHint: 'Управление подпиской — в настройках Яндекс 360' },
  { id: 'mybook', name: 'MyBook', price: 299, category: 'other', color: '#E63950', letter: 'M', cancelUrl: 'https://mybook.ru', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'google-one', name: 'Google One', price: 139, category: 'software', color: '#4285F4', letter: 'G', cancelUrl: 'https://one.google.com', cancelHint: 'Google One → Управление подпиской' },
  { id: 'chatgpt-plus', name: 'ChatGPT Plus', price: 1999, category: 'software', color: '#10A37F', letter: 'C', cancelUrl: 'https://chatgpt.com', cancelHint: 'Settings → Subscription в приложении ChatGPT' },
  { id: 'vk-combo', name: 'VK Combo', price: 229, category: 'other', color: '#2787F5', letter: 'V', cancelUrl: 'https://vk.com', cancelHint: 'Настройки VK ID → Подписки → VK Combo' },
  { id: 'stepik', name: 'Stepik', price: 599, category: 'education', color: '#33BDB0', letter: 'S', cancelUrl: 'https://stepik.org', cancelHint: 'Личный кабинет → Подписка' },
  { id: 'mail-cloud', name: 'Облако Mail.ru', price: 199, category: 'software', color: '#005FF9', letter: 'О', cancelUrl: 'https://cloud.mail.ru', cancelHint: 'Настройки облака → Подписка' },
  { id: 'claude-pro', name: 'Claude Pro', price: 1999, category: 'software', color: '#CC785C', letter: 'C', cancelUrl: 'https://claude.ai', cancelHint: 'Настройки → Billing на claude.ai' },
  { id: 'github-copilot', name: 'GitHub Copilot', price: 999, category: 'software', color: '#8957E5', letter: 'G', cancelUrl: 'https://github.com/settings/copilot', cancelHint: 'Settings → Copilot' },
  { id: 'midjourney', name: 'Midjourney', price: 999, category: 'software', color: '#4B0082', letter: 'M', cancelUrl: 'https://www.midjourney.com', cancelHint: 'Account → Subscription' },
  { id: 'perplexity-pro', name: 'Perplexity Pro', price: 1999, category: 'software', color: '#20808D', letter: 'P', cancelUrl: 'https://www.perplexity.ai', cancelHint: 'Settings → Account → Subscription' },
];

export function searchPresets(query) {
  const q = query.trim().toLowerCase();
  if (!q) return PRESETS;
  return PRESETS.filter((p) => p.name.toLowerCase().includes(q));
}

export function getPresetById(id) {
  return PRESETS.find((p) => p.id === id) ?? null;
}

const FALLBACK_COLORS = ['#6C5CE7', '#00B894', '#0984E3', '#E17055', '#D63031', '#00CEC9', '#FDCB6E'];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/**
 * Возвращает {color, letter} для отображения иконки подписки:
 * по пресету, если он указан в iconKey, иначе — по первой букве названия.
 */
export function getIconFor(subscription) {
  const preset = subscription.iconKey ? getPresetById(subscription.iconKey) : null;
  if (preset) return { color: preset.color, letter: preset.letter };
  const name = subscription.name || '?';
  return { color: hashColor(name), letter: name.trim().charAt(0).toUpperCase() || '?' };
}
