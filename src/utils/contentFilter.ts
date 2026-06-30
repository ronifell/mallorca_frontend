/**
 * Client-side mirror of the backend content filter
 * (`Backend/src/utils/contentFilter.ts`). It runs the same rules-based checks
 * locally so inappropriate text is blocked instantly in the UI, before any
 * network round-trip. The backend remains the source of truth and re-runs the
 * same checks server-side; this is purely a fast first line of defence + UX.
 *
 * Keep the rules in sync with the backend. Detection is heuristic — extend the
 * word lists / patterns over time rather than treating them as exhaustive.
 */

export type ContentCategory =
  | 'link'
  | 'phone'
  | 'social'
  | 'spam'
  | 'sexual'
  | 'aggressive'
  | 'illegal';

/** Profile fields are public, so they are held to the same strict standard as chat. */
export type FilterContext = 'chat' | 'profile';

export interface FilterResult {
  blocked: boolean;
  category?: ContentCategory;
  /** The substring that triggered the block (useful for debugging). */
  match?: string;
}

/** Lower-case + strip diacritics so "tú"/"TU" and "café" normalise consistently. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function wordList(terms: string[]): RegExp {
  const escaped = terms
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
}

// --- Links / URLs -----------------------------------------------------------
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i;
const TLD =
  '(?:com|net|org|io|me|es|co|info|biz|app|link|gg|tv|xyz|online|site|club|live|cc|to|ly|be|ru|de|fr|it|uk|nl|pt|eu|shop|store|page|dev)';
const DOMAIN_RE = new RegExp(`\\b[a-z0-9][a-z0-9-]{1,}\\.${TLD}\\b(?:\\/\\S*)?`, 'i');
const OBFUSCATED_DOMAIN_RE = new RegExp(
  `\\b[a-z0-9-]{2,}\\s*[\\[(]?\\s*(?:\\.|dot|punto)\\s*[\\])]?\\s*${TLD}\\b`,
  'i',
);

// --- Social handles / off-platform contact ----------------------------------
const HANDLE_RE = /(?:^|[^\w@/])@[a-z0-9._]{2,30}\b/i;
const SOCIAL_PLATFORM_RE = wordList([
  'instagram',
  'insta',
  'whatsapp',
  'whatsap',
  'whats app',
  'wasap',
  'wsp',
  'telegram',
  'snapchat',
  'snap chat',
  'tiktok',
  'tik tok',
  'facebook',
  'messenger',
  'onlyfans',
  'only fans',
  'twitter',
  'kik',
  'viber',
  'discord',
]);

// --- Phone numbers ----------------------------------------------------------
const PHONE_CANDIDATE_RE = /\+?\d(?:[\d\s().-]{5,}\d)/g;

// --- Spam -------------------------------------------------------------------
const REPEATED_CHAR_RE = /(.)\1{7,}/;
const REPEATED_WORD_RE = /\b([a-z]{2,})\b(?:\s+\1\b){3,}/i;
const SPAM_PHRASE_RE = wordList([
  'free money',
  'make money fast',
  'work from home',
  'click here',
  'buy followers',
  'crypto investment',
  'forex trading',
  'online casino',
  'casino bonus',
  'viagra',
  'gana dinero',
  'dinero facil',
  'dinero rapido',
  'gana desde casa',
  'haz clic aqui',
  'inversion garantizada',
  'criptomonedas gratis',
]);

// --- Sexual / explicit ------------------------------------------------------
const SEXUAL_RE = wordList([
  'porn',
  'porno',
  'pornhub',
  'xxx',
  'nudes',
  'nude pics',
  'send nudes',
  'sexting',
  'horny',
  'blowjob',
  'cumshot',
  'handjob',
  'masturbate',
  'masturbation',
  'dick pic',
  'cock',
  'pussy',
  'creampie',
  'anal',
  'escort',
  'escorts',
  'hookup for sex',
  'pornografia',
  'desnudos',
  'fotos desnuda',
  'fotos desnudo',
  'mandame desnudos',
  'caliente',
  'mamada',
  'paja',
  'polla',
  'verga',
  'coño',
  'cono',
  'follar',
  'sexo gratis',
  'putas',
  'puta',
]);

// --- Aggressive / harassment ------------------------------------------------
const AGGRESSIVE_RE = wordList([
  'kill yourself',
  'kys',
  'i will kill you',
  'i will find you',
  'i will hurt you',
  'rape you',
  'fuck you',
  'fuck off',
  'son of a bitch',
  'bitch',
  'whore',
  'slut',
  'retard',
  'faggot',
  'nigger',
  'te voy a matar',
  'te voy a encontrar',
  'te voy a hacer dano',
  'matate',
  'puta de mierda',
  'maricon',
  'zorra',
  'hijo de puta',
  'vete a la mierda',
  'cabron',
  'imbecil',
  'idiota de mierda',
]);

// --- Illegal ----------------------------------------------------------------
const ILLEGAL_RE = wordList([
  'buy cocaine',
  'sell cocaine',
  'buy weed',
  'sell drugs',
  'buy mdma',
  'buy meth',
  'cocaine for sale',
  'vendo droga',
  'vendo cocaina',
  'vendo marihuana',
  'venta de droga',
  'buy a gun',
  'guns for sale',
  'vendo armas',
  'child porn',
  'cp pics',
  'underage',
  'menor de edad sexo',
  'pornografia infantil',
  'preteen',
  'lolita',
]);

function hasLink(folded: string, raw: string): boolean {
  return URL_RE.test(raw) || DOMAIN_RE.test(folded) || OBFUSCATED_DOMAIN_RE.test(folded);
}

function hasPhone(raw: string): boolean {
  PHONE_CANDIDATE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE_CANDIDATE_RE.exec(raw)) !== null) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) return true;
  }
  return false;
}

function hasSocial(folded: string, raw: string): boolean {
  if (HANDLE_RE.test(raw)) return true;
  if (SOCIAL_PLATFORM_RE.test(folded)) return true;
  return false;
}

function isCapsFlood(raw: string): boolean {
  const letters = raw.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 15) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.8;
}

function hasSpam(folded: string, raw: string): boolean {
  return (
    REPEATED_CHAR_RE.test(raw) ||
    REPEATED_WORD_RE.test(folded) ||
    SPAM_PHRASE_RE.test(folded) ||
    isCapsFlood(raw)
  );
}

/**
 * Inspect a piece of text and return the first violation found, if any.
 * Order is chosen so the most serious / most actionable category wins.
 */
export function inspectContent(raw: string, context: FilterContext = 'chat'): FilterResult {
  void context;
  if (!raw || !raw.trim()) return { blocked: false };
  const folded = fold(raw);

  const illegal = folded.match(ILLEGAL_RE);
  if (illegal) return { blocked: true, category: 'illegal', match: illegal[1] };

  const sexual = folded.match(SEXUAL_RE);
  if (sexual) return { blocked: true, category: 'sexual', match: sexual[1] };

  const aggressive = folded.match(AGGRESSIVE_RE);
  if (aggressive) return { blocked: true, category: 'aggressive', match: aggressive[1] };

  if (hasLink(folded, raw)) return { blocked: true, category: 'link' };
  if (hasPhone(raw)) return { blocked: true, category: 'phone' };
  if (hasSocial(folded, raw)) return { blocked: true, category: 'social' };
  if (hasSpam(folded, raw)) return { blocked: true, category: 'spam' };

  return { blocked: false };
}

/** i18n key for the user-facing message of each blocked category. */
export function categoryMessageKey(category: ContentCategory): string {
  return `contentFilter.${category}`;
}
