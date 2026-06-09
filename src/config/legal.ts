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

export const CONTACT_EMAILS = {
  general: 'info@citasmallorca.es',
  support: 'soporte@citasmallorca.es',
} as const;
