/**
 * Brand-owned legal documents and contact addresses.
 *
 * Lives in src/config so it can be imported anywhere (auth, settings, etc.)
 * without circular deps. The web hosts the canonical copy of these texts.
 */

export const PUBLIC_WEB_BASE = 'http://www.citasmallorca.es';

export const LEGAL_LINKS = {
  terms: `${PUBLIC_WEB_BASE}/terminos-condiciones.html`,
  privacy: `${PUBLIC_WEB_BASE}/politica-privacidad.html`,
  /** Generic "where do legal docs live" pointer used in some screens. */
  home: PUBLIC_WEB_BASE,
} as const;

/** Official company address for all in-app contact and general enquiries. */
export const OFFICIAL_EMAIL = 'info@citasmallorca.es';

/** Dedicated technical-support address (app issues, payments, account help). */
export const SUPPORT_EMAIL = 'support@citasmallorca.es';

export const CONTACT_EMAILS = {
  general: OFFICIAL_EMAIL,
  support: SUPPORT_EMAIL,
} as const;
