import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterContext } from '../utils/contentFilter';
import { createFilteredChangeHandler } from '../utils/contentFilterHelpers';

/**
 * Text input state with client-side content filtering. Blocks additions that
 * would violate the filter while still allowing deletions/edits.
 */
export function useFilteredText(initial = '', context: FilterContext = 'chat') {
  const { t } = useTranslation();
  const [value, setValue] = useState(initial);
  const [filterError, setFilterError] = useState<string | null>(null);

  const onChangeText = useCallback(
    (text: string) => {
      createFilteredChangeHandler(value, setValue, context, t, setFilterError)(text);
      if (text.length <= value.length) {
        setFilterError(null);
      }
    },
    [context, t, value],
  );

  const reset = useCallback((next = '') => {
    setValue(next);
    setFilterError(null);
  }, []);

  return { value, onChangeText, filterError, setValue: reset, clearFilterError: () => setFilterError(null) };
}
