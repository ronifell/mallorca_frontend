# Frontend pre-release notes (1.0.28 / versionCode 29)

Companion to `Backend/docs/PRE_RELEASE.md`.

## Cleartext traffic

- Production EAS builds: `usesCleartextTraffic: false` when `EAS_BUILD_PROFILE=production`.
- Preview/development: cleartext remains enabled for HTTP LAN APIs.
- Production `eas.json` API/socket URLs must stay on **HTTPS**.

## npm audit

Latest snapshot (~1 critical / ~27 high) is dominated by Expo / React Native / Metro / `eas-cli` tooling. Many “fixes” require **major** Expo/RN upgrades and are **not** drop-in for this release.

**For this production cut:**

1. Run `npm audit` / `npm audit fix` (non-force) before each EAS build.
2. Do **not** `npm audit fix --force` without a full regression (Expo SDK jump).
3. Schedule an Expo SDK upgrade cycle for the remaining high/critical tooling advisories.
4. Critical `tar` appears via `eas-cli` / install tooling — keep CLI updated globally (`npm i -g eas-cli`) separately from the app lockfile when possible.

## Release tag

```bash
git tag -a app-1.0.28-code29 -m "Play AAB 1.0.28 (versionCode 29)"
git push origin app-1.0.28-code29
```

Pair with backend tag `api-code29` and confirm `GET /health` → `gitCommit` matches the deployed API SHA.
