import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FilterContext,
  categoryMessageKey,
  inspectContent,
} from '../utils/contentFilter';

/**
 * Returns a `check(text, context)` helper that runs the local content filter
 * and, when the text is blocked, returns a localized message to show the user.
 * Returns `null` when the text is allowed.
 */
export function useContentFilter() {
  const { t } = useTranslation();

  const check = useCallback(
    (text: string, context: FilterContext = 'chat'): string | null => {
      const result = inspectContent(text, context);
      if (!result.blocked || !result.category) return null;
      return t(categoryMessageKey(result.category));
    },
    [t],
  );

  return { check };
}
