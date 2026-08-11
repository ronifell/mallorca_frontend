# Frontend pre-release notes (1.0.28 / versionCode 29)

Companion to `Backend/docs/PRE_RELEASE.md`.

## Cleartext traffic

- Production EAS builds: `usesCleartextTraffic: false` when `EAS_BUILD_PROFILE=production`.
- Preview/development: cleartext remains enabled for HTTP LAN APIs.
- Production `eas.json` API/socket URLs must stay on **HTTPS**.

## npm audit

Direct / runtime-facing items for 1.0.30:

- `axios` ≥ 1.18 (lockfile 1.19.0)
- `tar` override → 7.5.22 (clears critical Expo CLI / cacache chain)
- Runtime chat stack (`socket.io-client`): overrides pin `engine.io-client` ≥ 6.6.6, `socket.io-parser` ≥ 4.2.7, and that client’s `ws` ≥ 8.21.3

Remaining highs are mostly Expo SDK 51 / React Native / Metro / CLI tooling (`xmldom`, PostCSS, `image-size`, Metro `ws@6`/`ws@7`, etc.). Those older `ws` copies are **not** on the production Socket.IO path — they belong to Metro / RN CLI / Expo CLI used at build/dev time. Clearing them needs a major Expo/RN upgrade tracked separately.

**For this production cut:**

1. Run `npm audit --omit=dev --package-lock-only` before each EAS build.
2. Do **not** `npm audit fix --force` without a full regression (Expo SDK jump).
3. Schedule an Expo SDK upgrade cycle for the remaining tooling advisories.

## Release tags

| Tag | Commit | Meaning |
|-----|--------|---------|
| `app-1.0.30-code31` | `2a7b1e6` | Smoke-tested AAB before runtime Socket.IO pins |
| `app-1.0.31-code32` | `d60e6ac` | Includes Socket.IO runtime pins (`d72da8b`) + version bump |

```bash
git tag -a app-1.0.31-code32 d60e6ac -m "Play AAB 1.0.31 (versionCode 32)"
git push origin app-1.0.31-code32
```

EAS build for this cut: `70e06f14-26fd-45d5-a385-dd0abbb666b8`  
AAB: https://expo.dev/artifacts/eas/DbeClY1Ya9exAi_M5MBqSzUyR34267NTNaqy7b0Ii2E.aab

Submit to Play Internal Testing (`eas.json` → `track: internal`) needs a **Google Play Console service account JSON** (not Firebase `google-services.json` / Firebase Admin SDK). Once that key is available:

```bash
npx eas submit --platform android --id 70e06f14-26fd-45d5-a385-dd0abbb666b8 --profile production
```

Or upload the AAB manually in Play Console → Testing → Internal testing.

Pair with backend `b92cc5b` / tag `api-b92cc5b` and confirm `GET /health` → `gitCommit` matches.
