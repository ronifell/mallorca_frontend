import i18n from '../i18n';

/** BCP-47 tag for dates/prices matching the active app language. */
export function appLocaleTag(): string {
  return i18n.language === 'en' ? 'en-GB' : 'es-ES';
}

export function formatAppDate(iso: string): string {
  return new Date(iso).toLocaleDateString(appLocaleTag());
}
