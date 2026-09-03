/**
 * Formats any date string, ISO timestamp, or Date object to DD-MM-YYYY or DD/MM/YYYY
 * e.g. "2026-09-02" -> "02-09-2026"
 * e.g. "2014-05-12T10:00:00Z" -> "12-05-2014"
 */
export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed.replace(/\//g, '-');
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d}-${m}-${y}`;
    }
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats any date string, ISO timestamp, or Date object to DD/MM/YYYY
 * e.g. "2026-09-02" -> "02/09/2026"
 * e.g. "02-09-2026" -> "02/09/2026"
 */
export function formatDateSlash(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed.replace(/-/g, '/');
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d}/${m}/${y}`;
    }
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Converts a date string (DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD) into standard ISO YYYY-MM-DD
 * e.g. "29/09/2005" -> "2005-09-29"
 * e.g. "29-09-2005" -> "2005-09-29"
 * e.g. "2005-09-29" -> "2005-09-29"
 */
export function parseDateToISO(dateInput: string | undefined | null): string {
  if (!dateInput) return '';
  const trimmed = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    return `${y}-${month}-${day}`;
  }

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback
  }

  return trimmed;
}

/**
 * Checks if a string is a complete and valid date in DD/MM/YYYY or DD-MM-YYYY
 */
export function isValidDateDDMMYYYY(val: string): boolean {
  if (!val) return false;
  const match = val.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

export function formatNoticeDate(iso: string): string {
  return formatDateDDMMYYYY(iso);
}

