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
  'x.com',
  'linkedin',
  'linkdin',
  'youtube',
  'youtu',
  'signal',
  'wechat',
  'line app',
  'kik',
  'viber',
  'discord',
  'threads',
  'pinterest',
  'reddit',
  'tumblr',
  'skype',
]);

// --- Phone numbers ----------------------------------------------------------
// Wide separator class to catch symbol-obfuscated numbers ("6*6*6_7-7-7").
const PHONE_CANDIDATE_RE = /\+?\d(?:[\d\s().\-*_+·•/\\|#,]{5,}\d)/g;

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

// --- De-obfuscation ---------------------------------------------------------
// Mirror of the backend logic: normalise the text into several variants so
// spaced-out ("i n s t a"), leetspeak ("wh4ts4pp") and "at/dot" email tricks
// are caught. Keep in sync with Backend/src/utils/contentFilter.ts.

const SEPARATOR_CHARS = "\\s._\\-*·•|/\\\\~^=+#,:;'\"()\\[\\]{}";
const SEPARATOR_RUN_RE = new RegExp(`[${SEPARATOR_CHARS}]+`, 'g');
const SPACED_CHARS_RE = new RegExp(
  `\\b(?:[a-z0-9](?:[${SEPARATOR_CHARS}]+)){2,}[a-z0-9]\\b`,
  'gi',
);

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  $: 's',
  '€': 'e',
  '!': 'i',
};

function deLeet(text: string): string {
  return text.replace(/[013457890@$€!]/g, (c) => LEET_MAP[c] ?? c);
}

function collapseSpacedChars(text: string): string {
  return text.replace(SPACED_CHARS_RE, (m) => m.replace(SEPARATOR_RUN_RE, ''));
}

const EMAIL_RE =
  /[a-z0-9._%+-]+\s*(?:@|\(\s*at\s*\)|\[\s*at\s*\]|\s+at\s+|\s+arroba\s+)\s*[a-z0-9.-]+\s*(?:\.|\(\s*dot\s*\)|\[\s*dot\s*\]|\s+dot\s+|\s+punto\s+)\s*[a-z]{2,}/i;

const NUMBER_WORDS_RE =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/gi;

function buildVariants(raw: string): string[] {
  const folded = fold(raw);
  const variants = new Set<string>([
    folded,
    deLeet(folded),
    collapseSpacedChars(folded),
    collapseSpacedChars(deLeet(folded)),
  ]);
  return [...variants];
}

function matchAny(variants: string[], re: RegExp): RegExpMatchArray | null {
  for (const v of variants) {
    const m = v.match(re);
    if (m) return m;
  }
  return null;
}

function testAny(variants: string[], re: RegExp): boolean {
  return variants.some((v) => re.test(v));
}

function hasLink(variants: string[], raw: string): boolean {
  return (
    URL_RE.test(raw) ||
    testAny(variants, DOMAIN_RE) ||
    testAny(variants, OBFUSCATED_DOMAIN_RE)
  );
}

function countDigitRun(text: string): boolean {
  PHONE_CANDIDATE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE_CANDIDATE_RE.exec(text)) !== null) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) return true;
  }
  return false;
}

function hasPhone(variants: string[], raw: string): boolean {
  if (countDigitRun(raw)) return true;
  if (variants.some((v) => countDigitRun(v))) return true;
  const words = raw.match(NUMBER_WORDS_RE);
  if (words && words.length >= 7) return true;
  return false;
}

function hasEmail(variants: string[]): boolean {
  return testAny(variants, EMAIL_RE);
}

function hasSocial(variants: string[], raw: string): boolean {
  if (HANDLE_RE.test(raw)) return true;
  if (testAny(variants, HANDLE_RE)) return true;
  return testAny(variants, SOCIAL_PLATFORM_RE);
}

function isCapsFlood(raw: string): boolean {
  const letters = raw.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 15) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.8;
}

function hasSpam(variants: string[], raw: string): boolean {
  return (
    REPEATED_CHAR_RE.test(raw) ||
    testAny(variants, REPEATED_WORD_RE) ||
    testAny(variants, SPAM_PHRASE_RE) ||
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

  const variants = buildVariants(raw);

  const illegal = matchAny(variants, ILLEGAL_RE);
  if (illegal) return { blocked: true, category: 'illegal', match: illegal[1] };

  const sexual = matchAny(variants, SEXUAL_RE);
  if (sexual) return { blocked: true, category: 'sexual', match: sexual[1] };

  const aggressive = matchAny(variants, AGGRESSIVE_RE);
  if (aggressive) return { blocked: true, category: 'aggressive', match: aggressive[1] };

  if (hasEmail(variants)) return { blocked: true, category: 'social' };
  if (hasLink(variants, raw)) return { blocked: true, category: 'link' };
  if (hasPhone(variants, raw)) return { blocked: true, category: 'phone' };
  if (hasSocial(variants, raw)) return { blocked: true, category: 'social' };
  if (hasSpam(variants, raw)) return { blocked: true, category: 'spam' };

  return { blocked: false };
}

/** i18n key for the user-facing message of each blocked category. */
export function categoryMessageKey(category: ContentCategory): string {
  return `contentFilter.${category}`;
}
