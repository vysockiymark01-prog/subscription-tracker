import ru from './locales/ru.js';
import kk from './locales/kk.js';
import uk from './locales/uk.js';
import be from './locales/be.js';
import uz from './locales/uz.js';

export const DEFAULT_LOCALE = 'ru';

export const LOCALES = { ru, kk, uk, be, uz };

export const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'uk', label: 'Українська' },
  { code: 'be', label: 'Беларуская' },
  { code: 'uz', label: "O'zbekcha" },
];

/**
 * Подстановка переменных вида {name} в переведённую строку.
 */
export function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

/**
 * Славянские языки (ru/uk/be) различают три формы множественного числа
 * ("1 подписка / 2 подписки / 5 подписок"). Тюркские (kk/uz) в этом словаре
 * такого различия не делают — форма одна, поэтому просто используем "many"
 * как основную. Возвращает суффикс формы: 'one' | 'few' | 'many'.
 */
export function pluralForm(locale, n) {
  const abs = Math.abs(n);
  if (locale === 'kk' || locale === 'uz') return 'many';
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'few';
  return 'many';
}
