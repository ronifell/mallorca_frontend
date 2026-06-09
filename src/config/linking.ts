/** Must match `scheme` in app.json / app.config.js */
export const APP_DEEP_LINK_SCHEME = 'citasmallorca';

/** Must match `android.package` in app.json */
export const ANDROID_PACKAGE = 'es.citasmallorca.app';

export const EMAIL_VERIFIED_DEEP_LINK = `${APP_DEEP_LINK_SCHEME}://email-verified`;

export function buildAppVerifyDeepLink(token: string): string {
  return `${APP_DEEP_LINK_SCHEME}://verify-email?token=${encodeURIComponent(token)}`;
}

export function buildAndroidEmailVerifiedIntent(): string {
  return `intent://email-verified#Intent;scheme=${APP_DEEP_LINK_SCHEME};package=${ANDROID_PACKAGE};end`;
}
