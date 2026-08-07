/** Error whose user-facing text lives in i18n (key under errors.* or billing.*). */
export class LocalizedError extends Error {
  readonly i18nKey: string;

  readonly i18nParams?: Record<string, string>;

  constructor(i18nKey: string, i18nParams?: Record<string, string>) {
    super(i18nKey);
    this.name = 'LocalizedError';
    this.i18nKey = i18nKey;
    this.i18nParams = i18nParams;
  }
}

export function isLocalizedError(err: unknown): err is LocalizedError {
  return err instanceof LocalizedError;
}
