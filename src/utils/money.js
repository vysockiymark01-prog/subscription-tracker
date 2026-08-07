const PERIODS_PER_YEAR = {
  week: 52,
  month: 12,
  quarter: 4,
  year: 1,
};

export function toAnnual(price, period) {
  return price * (PERIODS_PER_YEAR[period] ?? 12);
}

export function toMonthly(price, period) {
  return toAnnual(price, period) / 12;
}

// Валюты РФ, СНГ и основные мировые — с символом и локалью для форматирования чисел.
export const CURRENCIES = [
  { code: 'RUB', symbol: '₽', label: 'Российский рубль', locale: 'ru-RU' },
  { code: 'USD', symbol: '$', label: 'Доллар США', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'Евро', locale: 'de-DE' },
  { code: 'KZT', symbol: '₸', label: 'Казахстанский тенге', locale: 'kk-KZ' },
  { code: 'BYN', symbol: 'Br', label: 'Белорусский рубль', locale: 'be-BY' },
  { code: 'UAH', symbol: '₴', label: 'Украинская гривна', locale: 'uk-UA' },
  { code: 'UZS', symbol: 'сум', label: 'Узбекский сум', locale: 'uz-UZ' },
  { code: 'AMD', symbol: '֏', label: 'Армянский драм', locale: 'hy-AM' },
  { code: 'AZN', symbol: '₼', label: 'Азербайджанский манат', locale: 'az-AZ' },
  { code: 'GEL', symbol: '₾', label: 'Грузинский лари', locale: 'ka-GE' },
  { code: 'KGS', symbol: 'с', label: 'Киргизский сом', locale: 'ky-KG' },
  { code: 'TJS', symbol: 'ЅМ', label: 'Таджикский сомони', locale: 'tg-TJ' },
  { code: 'MDL', symbol: 'L', label: 'Молдавский лей', locale: 'ro-MD' },
];

const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));
const DEFAULT_CURRENCY = 'RUB';

export function getCurrency(code) {
  return CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE[DEFAULT_CURRENCY];
}

/**
 * Форматирует сумму с учётом выбранной валюты (символ и локальный разделитель разрядов).
 * Если код валюты не передан или неизвестен — используется рубль (для обратной совместимости
 * со старыми данными без поля currency).
 */
export function formatMoney(amount, currencyCode = DEFAULT_CURRENCY) {
  const currency = getCurrency(currencyCode);
  return `${Math.round(amount).toLocaleString(currency.locale)} ${currency.symbol}`;
}

// Оставлено для обратной совместимости со старым кодом/данными без указания валюты.
export function formatRub(amount) {
  return formatMoney(amount, 'RUB');
}

/**
 * Доля пользователя в стоимости подписки, если она разделена между
 * несколькими людьми (splitCount).
 */
export function splitPrice(subscription) {
  const count = subscription.splitCount > 0 ? subscription.splitCount : 1;
  return subscription.price / count;
}
