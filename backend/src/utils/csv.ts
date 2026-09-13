/**
 * Утилиты для генерации CSV-отчётов.
 * Экранирование соответствует RFC 4180.
 */

/** Экранирует значение для CSV. */
function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Преобразует массив объектов в CSV-строку.
 * @param rows массив объектов
 * @param columns порядок и заголовки колонок
 */
export function toCsv(rows: Record<string, unknown>[], columns: { header: string; key: string }[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','));
  return [header, ...body].join('\r\n');
}
