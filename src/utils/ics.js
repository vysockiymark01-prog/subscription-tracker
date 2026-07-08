function escapeIcsText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDate(dateStr) {
  return dateStr.replace(/-/g, '');
}

function toIcsDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

const RRULE_FREQ = {
  week: 'WEEKLY',
  month: 'MONTHLY',
  quarter: 'MONTHLY;INTERVAL=3',
  year: 'YEARLY',
};

/**
 * Формирует .ics-файл с повторяющимся событием списания и напоминанием
 * за reminderDays дней — на основе данных подписки, без обращения к сети.
 */
export function buildSubscriptionIcs(subscription) {
  const dtstart = toIcsDate(subscription.nextPaymentDate);
  const freq = RRULE_FREQ[subscription.period] ?? 'MONTHLY';
  const summary = escapeIcsText(`Списание: ${subscription.name}`);
  const description = escapeIcsText(`${subscription.price} ₽ — Трекер подписок`);
  const uid = `${subscription.id}@subscription-tracker`;
  const alarmDays = subscription.reminderDays > 0 ? subscription.reminderDays : 3;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Трекер подписок//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `RRULE:FREQ=${freq}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    `TRIGGER:-P${alarmDays}D`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
