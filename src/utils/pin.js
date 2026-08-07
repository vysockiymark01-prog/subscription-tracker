/**
 * Хэшируем PIN-код через SubtleCrypto (SHA-256), чтобы не хранить его в открытом
 * виде в localStorage. Это не банковский уровень защиты (данные и так лежат в
 * этом же браузере), а скорее барьер от случайного открытия приложения кем-то
 * рядом — вроде экрана блокировки на телефоне.
 */
export async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(pin, hash) {
  if (!hash) return false;
  const candidate = await hashPin(pin);
  return candidate === hash;
}
