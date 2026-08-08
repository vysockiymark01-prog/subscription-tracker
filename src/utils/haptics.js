// Лёгкий тактильный отклик на ключевые действия. Поддерживается не везде
// (например, отсутствует в Safari/iOS) — поэтому всегда safe-fallback без ошибок.

export function vibrate(pattern = 15) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // не критично
  }
}
