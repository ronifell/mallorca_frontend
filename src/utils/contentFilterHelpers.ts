import axios from 'axios';
import {
  ContentCategory,
  FilterContext,
  categoryMessageKey,
  inspectContent,
} from './contentFilter';

type Translate = (key: string) => string;

/** Map a backend `CONTENT_BLOCKED` API error to a localized message. */
export function extractContentBlockedMessage(err: unknown, t: Translate): string | null {
  if (!axios.isAxiosError(err)) return null;
  const data = err.response?.data as
    | { error?: { code?: string; details?: { category?: ContentCategory } } }
    | undefined;
  const category = data?.error?.details?.category;
  if (data?.error?.code === 'CONTENT_BLOCKED' && category) {
    return t(categoryMessageKey(category));
  }
  return null;
}

/** Returns the first blocked profile field message, or null if all are clean. */
export function validateProfileFields(
  fields: { value: string; label?: string }[],
  check: (text: string, context: FilterContext) => string | null,
): string | null {
  for (const field of fields) {
    if (!field.value.trim()) continue;
    const blocked = check(field.value, 'profile');
    if (blocked) return blocked;
  }
  return null;
}

/**
 * Wraps a text onChange handler so additions that would violate the content
 * filter are rejected. Deletions are always allowed so the user can fix mistakes.
 */
export function createFilteredChangeHandler(
  currentValue: string,
  onChangeText: (text: string) => void,
  context: FilterContext,
  t: Translate,
  onBlocked?: (message: string) => void,
): (text: string) => void {
  return (text: string) => {
    const result = inspectContent(text, context);
    if (result.blocked && result.category && text.length > currentValue.length) {
      onBlocked?.(t(categoryMessageKey(result.category)));
      return;
    }
    onChangeText(text);
  };
}
