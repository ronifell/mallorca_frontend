# Frontend pre-release notes (1.0.35 / versionCode 36)

Companion to `Backend/docs/PRE_RELEASE.md`.

## Cleartext traffic

- Production EAS builds: `usesCleartextTraffic: false` when `EAS_BUILD_PROFILE=production`.
- Preview/development: cleartext remains enabled for HTTP LAN APIs.
- Production `eas.json` API/socket URLs must stay on **HTTPS**.

## npm audit

Direct / runtime-facing items addressed:

- `axios` ≥ 1.18 (lockfile 1.19.0)
- `tar` override → 7.5.22 (clears critical Expo CLI / cacache chain)
- Runtime chat stack (`socket.io-client`): overrides pin `engine.io-client` ≥ 6.6.6, `socket.io-parser` ≥ 4.2.7, and that client’s `ws` ≥ 8.21.3

Remaining highs/moderates are mostly Expo SDK 51 / React Native / Metro / CLI tooling (`uuid` via `@expo/*` / `xcode`, `xmldom`, PostCSS, Metro `ws@6`/`ws@7`, etc.). Clearing them needs a major Expo/RN upgrade (e.g. `npm audit fix --force` proposes Expo 57) tracked separately — **do not force** without full regression.

**For this production cut:**

1. Run `npm audit --omit=dev --package-lock-only` before each EAS build.
2. Do **not** `npm audit fix --force` without a full regression (Expo SDK jump).
3. Schedule an Expo SDK upgrade cycle for the remaining tooling advisories.

## Typecheck / lint (1.0.35)

- `npm run typecheck` (`tsc --noEmit`) — **clean** after `module: esnext` + RN/nav typing fixes.
- `npm run lint` — **runs** (added `.eslintrc.cjs`); 0 errors. Unused-import warnings cleaned in this cut.
- Residual audit advisories remain tooling-only as above.

## Release tags

| Tag | Commit | Meaning |
|-----|--------|---------|
| `app-1.0.34-code35` | `5cfc049` | Realtime chat Socket.IO polling fallback |
| `app-1.0.35-code36` | *(this cut)* | Localized password-reset email + 2-step onboarding indicator |

Pair with backend password-reset email localization deploy and confirm `GET /health` → `gitCommit` matches.
