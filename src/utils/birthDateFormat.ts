/**
 * Birth date is displayed to users in DD/MM/YYYY (Spanish convention) but
 * the backend API stores and validates it as ISO YYYY-MM-DD. These helpers
 * bridge between the two representations.
 */

const DISPLAY_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Progressive formatter for text input. Keeps only digits from the raw
 * value and inserts slashes at the day/month/year boundaries so the user
 * always sees DD/MM/YYYY while typing.
 */
export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Checks whether the given DD/MM/YYYY string is a real calendar date.
 */
export function isValidDisplayBirthDate(value: string): boolean {
  const match = DISPLAY_REGEX.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Converts a DD/MM/YYYY display string to ISO YYYY-MM-DD.
 * Returns null when the input is not a valid display date.
 */
export function displayToIsoBirthDate(value: string): string | null {
  if (!isValidDisplayBirthDate(value)) return null;
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Converts an ISO YYYY-MM-DD string (as returned by the API) to the
 * DD/MM/YYYY display format. Falls back to the original value if it does
 * not match the expected ISO shape so partially-entered values are kept.
 */
export function isoToDisplayBirthDate(value: string | null | undefined): string {
  if (!value) return '';
  const match = ISO_REGEX.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
