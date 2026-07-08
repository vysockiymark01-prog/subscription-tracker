function parseCsvRows(text) {
  const rows = [];
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    rows.push(fields.map((f) => f.trim()));
  }
  return rows;
}

const HEADER_ALIASES = {
  name: ['name', 'название', 'имя'],
  price: ['price', 'цена', 'стоимость'],
  period: ['period', 'период'],
  category: ['category', 'категория'],
  nextpaymentdate: ['nextpaymentdate', 'next_payment_date', 'дата', 'датасписания'],
};

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[\s_-]/g, '');
}

function detectColumnMap(headerRow) {
  const map = {};
  headerRow.forEach((raw, idx) => {
    const norm = normalizeHeader(raw);
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.map(normalizeHeader).includes(norm)) {
        map[key] = idx;
      }
    }
  });
  return map;
}

/**
 * Парсит CSV в массив полей подписок: { name, price, period, category, nextPaymentDate }.
 * Понимает заголовок (на русском или английском) либо использует порядок колонок
 * по умолчанию: name,price,period,category,nextPaymentDate.
 */
export function parseSubscriptionsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const detectedMap = detectColumnMap(firstRow);
  const looksLikeHeader = Object.keys(detectedMap).length >= 2;
  const columnMap = looksLikeHeader
    ? detectedMap
    : { name: 0, price: 1, period: 2, category: 3, nextpaymentdate: 4 };
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row) => ({
      name: row[columnMap.name]?.trim() ?? '',
      price: Number(row[columnMap.price]),
      period: row[columnMap.period]?.trim().toLowerCase() || 'month',
      category: row[columnMap.category]?.trim().toLowerCase() || 'other',
      nextPaymentDate: row[columnMap.nextpaymentdate]?.trim() ?? '',
    }))
    .filter((s) => s.name && Number.isFinite(s.price) && s.price > 0 && s.nextPaymentDate);
}
