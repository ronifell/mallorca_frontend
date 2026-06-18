/**
 * Catalogue of selectable city values for the profile "city" field.
 *
 * Two flavours of option live in this list:
 *
 *   1. Mallorca municipalities  — stored as the official Catalan name
 *      (e.g. "Palma", "Sóller"). The stored value is the display label;
 *      no localisation needed.
 *
 *   2. Special non-Mallorca catch-alls — stored as stable, locale-neutral
 *      identifiers (e.g. "visiting_mallorca", "another_spain") and
 *      resolved to a translated label through i18n at display time.
 *
 * Persisted on `users.city` exactly as the `value` field of the chosen
 * option so older free-text rows (legacy data) keep rendering correctly.
 */
export interface CityOption {
  /** Unique key for React list rendering. */
  id: string;
  /** What gets saved to `users.city` and round-tripped back. */
  value: string;
  /** Human-readable label for municipalities (display verbatim). */
  label?: string;
  /** i18n key under `profile.*` for special, translated options. */
  labelKey?: string;
}

/**
 * All 53 municipalities of the island of Mallorca, alphabetised by
 * official Catalan name. These are the only "Mallorca" options users
 * can pick — keeps the data clean and prevents typos / NSFW free-text.
 */
export const MALLORCA_MUNICIPALITIES: CityOption[] = [
  { id: 'alaro', value: 'Alaró', label: 'Alaró' },
  { id: 'alcudia', value: 'Alcúdia', label: 'Alcúdia' },
  { id: 'algaida', value: 'Algaida', label: 'Algaida' },
  { id: 'andratx', value: 'Andratx', label: 'Andratx' },
  { id: 'ariany', value: 'Ariany', label: 'Ariany' },
  { id: 'arta', value: 'Artà', label: 'Artà' },
  { id: 'banyalbufar', value: 'Banyalbufar', label: 'Banyalbufar' },
  { id: 'binissalem', value: 'Binissalem', label: 'Binissalem' },
  { id: 'buger', value: 'Búger', label: 'Búger' },
  { id: 'bunyola', value: 'Bunyola', label: 'Bunyola' },
  { id: 'calvia', value: 'Calvià', label: 'Calvià' },
  { id: 'campanet', value: 'Campanet', label: 'Campanet' },
  { id: 'campos', value: 'Campos', label: 'Campos' },
  { id: 'capdepera', value: 'Capdepera', label: 'Capdepera' },
  { id: 'consell', value: 'Consell', label: 'Consell' },
  { id: 'costitx', value: 'Costitx', label: 'Costitx' },
  { id: 'deia', value: 'Deià', label: 'Deià' },
  { id: 'escorca', value: 'Escorca', label: 'Escorca' },
  { id: 'esporles', value: 'Esporles', label: 'Esporles' },
  { id: 'estellencs', value: 'Estellencs', label: 'Estellencs' },
  { id: 'felanitx', value: 'Felanitx', label: 'Felanitx' },
  { id: 'fornalutx', value: 'Fornalutx', label: 'Fornalutx' },
  { id: 'inca', value: 'Inca', label: 'Inca' },
  { id: 'lloret-de-vistalegre', value: 'Lloret de Vistalegre', label: 'Lloret de Vistalegre' },
  { id: 'lloseta', value: 'Lloseta', label: 'Lloseta' },
  { id: 'llubi', value: 'Llubí', label: 'Llubí' },
  { id: 'llucmajor', value: 'Llucmajor', label: 'Llucmajor' },
  { id: 'manacor', value: 'Manacor', label: 'Manacor' },
  { id: 'mancor-de-la-vall', value: 'Mancor de la Vall', label: 'Mancor de la Vall' },
  { id: 'maria-de-la-salut', value: 'Maria de la Salut', label: 'Maria de la Salut' },
  { id: 'marratxi', value: 'Marratxí', label: 'Marratxí' },
  { id: 'montuiri', value: 'Montuïri', label: 'Montuïri' },
  { id: 'muro', value: 'Muro', label: 'Muro' },
  { id: 'palma', value: 'Palma', label: 'Palma' },
  { id: 'petra', value: 'Petra', label: 'Petra' },
  { id: 'pollenca', value: 'Pollença', label: 'Pollença' },
  { id: 'porreres', value: 'Porreres', label: 'Porreres' },
  { id: 'puigpunyent', value: 'Puigpunyent', label: 'Puigpunyent' },
  { id: 'sa-pobla', value: 'Sa Pobla', label: 'Sa Pobla' },
  { id: 'sant-joan', value: 'Sant Joan', label: 'Sant Joan' },
  { id: 'sant-llorenc', value: 'Sant Llorenç des Cardassar', label: 'Sant Llorenç des Cardassar' },
  { id: 'santa-eugenia', value: 'Santa Eugènia', label: 'Santa Eugènia' },
  { id: 'santa-margalida', value: 'Santa Margalida', label: 'Santa Margalida' },
  { id: 'santa-maria', value: 'Santa Maria del Camí', label: 'Santa Maria del Camí' },
  { id: 'santanyi', value: 'Santanyí', label: 'Santanyí' },
  { id: 'selva', value: 'Selva', label: 'Selva' },
  { id: 'sencelles', value: 'Sencelles', label: 'Sencelles' },
  { id: 'ses-salines', value: 'Ses Salines', label: 'Ses Salines' },
  { id: 'sineu', value: 'Sineu', label: 'Sineu' },
  { id: 'soller', value: 'Sóller', label: 'Sóller' },
  { id: 'son-servera', value: 'Son Servera', label: 'Son Servera' },
  { id: 'valldemossa', value: 'Valldemossa', label: 'Valldemossa' },
  { id: 'vilafranca', value: 'Vilafranca de Bonany', label: 'Vilafranca de Bonany' },
];

/**
 * Catch-all options surfaced under an "Other" section in the picker, for
 * users who don't live in any of the 53 municipalities. The `value` is
 * a stable identifier so the backend stores a predictable token and the
 * display layer can localise it.
 */
export const SPECIAL_CITY_OPTIONS: CityOption[] = [
  {
    id: 'visiting_mallorca',
    value: 'visiting_mallorca',
    labelKey: 'profile.cityVisitingMallorca',
  },
  {
    id: 'another_spain',
    value: 'another_spain',
    labelKey: 'profile.cityAnotherSpain',
  },
  {
    id: 'outside_spain',
    value: 'outside_spain',
    labelKey: 'profile.cityOutsideSpain',
  },
  {
    id: 'other',
    value: 'other',
    labelKey: 'profile.cityOther',
  },
];

/** Lookup set of every special id, for fast "is this a non-Mallorca tag?" checks. */
const SPECIAL_VALUE_SET = new Set(SPECIAL_CITY_OPTIONS.map((o) => o.value));

/** Returns true if the stored city value is one of the translated catch-all tags. */
export function isSpecialCityValue(value: string | null | undefined): boolean {
  return !!value && SPECIAL_VALUE_SET.has(value);
}

/** Resolves a stored city value (Mallorca municipality OR special id) to the
 * label to render. Falls back to the verbatim value for legacy free-text rows. */
export function resolveCityLabel(
  value: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!value) return null;
  const special = SPECIAL_CITY_OPTIONS.find((o) => o.value === value);
  if (special?.labelKey) return t(special.labelKey);
  const mallorca = MALLORCA_MUNICIPALITIES.find((o) => o.value === value);
  if (mallorca?.label) return mallorca.label;
  return value;
}
