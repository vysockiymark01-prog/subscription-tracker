// Конвертация валют по курсу ЦБ РФ.
// Источник — открытое CORS-зеркало официального курса ЦБ (обновляется раз в сутки).
// Если сервис недоступен (нет сети, блокировка и т.п.) — приложение просто
// показывает суммы раздельно по валютам, конвертация не обязательна для работы.

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CACHE_KEY = 'cbr-rates-cache-v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.) — не критично
  }
}

/**
 * Возвращает объект { RUB: 1, USD: 79.x, EUR: 92.x, ... } — сколько рублей стоит
 * одна единица валюты. Кэшируется на 12 часов, чтобы не дёргать сеть при каждом рендере.
 */
export async function fetchRatesToRub({ force = false } = {}) {
  const cached = readCache();
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  try {
    const res = await fetch(CBR_URL);
    if (!res.ok) throw new Error(`Курс ЦБ недоступен: ${res.status}`);
    const data = await res.json();

    const rates = { RUB: 1 };
    for (const [code, info] of Object.entries(data.Valute ?? {})) {
      if (info?.Value && info?.Nominal) {
        rates[code] = info.Value / info.Nominal;
      }
    }

    writeCache({ fetchedAt: Date.now(), rates, date: data.Date });
    return rates;
  } catch (err) {
    // Нет сети (офлайн) или сервис недоступен — лучше показать чуть устаревший
    // курс, чем ничего. Если сохранённого курса вообще никогда не было — тогда
    // действительно нечего показать, пробрасываем ошибку дальше.
    if (cached) return cached.rates;
    throw err;
  }
}

export function getCachedRatesDate() {
  return readCache()?.date ?? null;
}

/**
 * Конвертирует сумму из одной валюты в другую через рубль как опорную точку.
 * Возвращает null, если курс одной из валют неизвестен (например, редкая
 * валюта, которую ЦБ не публикует) — тогда конвертация просто не делается.
 */
export function convertAmount(amount, fromCode, toCode, ratesToRub) {
  if (fromCode === toCode) return amount;
  const fromRate = ratesToRub?.[fromCode];
  const toRate = ratesToRub?.[toCode];
  if (!fromRate || !toRate) return null;
  return (amount * fromRate) / toRate;
}
