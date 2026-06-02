# Mallorca Dating – Mobile App

React Native (Expo) + TypeScript + NativeWind for the Mallorca dating &
networking app. Targets Android first; iOS-ready.

## Stack

- **React Native** via **Expo SDK 51** (single codebase, EAS Build for both
  Android & iOS)
- **TypeScript** strict mode
- **NativeWind v4 / TailwindCSS** for styling (theme tokens mirror the
  citasmallorca.es brand: warm cream backgrounds + dark red accents)
- **React Navigation** (native stack + bottom tabs)
- **TanStack Query (React Query)** for server state
- **Zustand** for auth/session state
- **i18next + expo-localization** (English + Spanish out of the box)
- **socket.io-client** for realtime chat
- **expo-image-picker** for profile/chat photos
- **expo-secure-store** for JWT storage
- **expo-notifications** for FCM/APNs push registration

## Setup

```bash
cd Frontend
npm install
npx expo start                 # interactive dev server
npm run android                # build & run on a connected device/emulator
```

> When running on a physical phone connected to the dev machine, edit
> `app.json → expo.extra.apiBaseUrl` to your computer's LAN IP
> (e.g. `http://192.168.1.42:4000`) so the device can reach the backend.

## Project layout

```
src/
  api/                – axios client (+ refresh token rotation), endpoints, types
  components/         – Button, Input, Logo, Avatar, Chip, SwipeCard, Row, Screen
  config/env.ts       – reads expo.extra.apiBaseUrl / socketUrl
  i18n/               – i18next config + en/es JSON
  navigation/         – Root, Auth, ProfileSetup, MainTabs
  screens/
    auth/             – Onboarding, Login, Register, ForgotPassword
    profile/          – Create/Edit Profile, UploadPhotos, ProfileScreen
    discovery/        – Tinder-style swipe screen
    matches/          – Matches list + new-match carousel
    chat/             – ChatList + Conversation (realtime + image uploads)
    premium/          – Premium plans + purchase
    settings/         – Settings, Language, Notifications, Privacy, Blocked
  services/
    socket.ts         – Socket.io client (JWT handshake, auto-reconnect)
    storage.ts        – SecureStore-backed token storage
    notifications.ts  – Expo push token registration → backend
    billing.ts        – startPurchase() — replace mock with react-native-iap
  store/auth.ts       – Zustand auth/session store
  styles/global.css   – Tailwind directives
  theme/colors.ts     – brand palette (mirrors tailwind.config.js)
```

## Color palette (citasmallorca.es-inspired)

| Token            | Hex       | Usage                          |
| ---------------- | --------- | ------------------------------ |
| `cream-200`      | `#F2EBE0` | Page background                |
| `cream-300`      | `#E9DECE` | Sub-surfaces, dividers         |
| `brand-500`      | `#B82E2E` | Primary buttons, hearts, CTAs  |
| `brand-50`       | `#FCEDEC` | Soft accent surfaces           |
| `ink-700`        | `#3D2618` | Primary text                   |
| `ink-400`        | `#7A5640` | Secondary text                 |
| `success`        | `#2E7D5B` | Swipe-right indicator          |

## Navigation tree

```
RootNavigator
 ├── (no user)               → AuthStack
 │                            ├── Onboarding
 │                            ├── Login
 │                            ├── Register
 │                            └── ForgotPassword
 ├── (profile incomplete)    → ProfileSetupStack
 │                            ├── CreateProfile
 │                            └── UploadPhotos
 └── (signed-in & complete)  → MainTabs
                              ├── Discover (swipe)
                              ├── Matches
                              ├── Chat
                              └── Profile
   plus modal/stack routes:   Conversation, Premium, EditProfile,
                              Settings, Language, Notifications,
                              Privacy, BlockedUsers
```

## Production builds (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:android          # → AAB ready for Play Console internal track
npm run build:ios              # → IPA via Expo's m-medium worker
```

`eas.json` profiles ship with `development`, `preview` (APK), `production`
(AAB / iOS).

## Production checklist

1. Set `expo.extra.apiBaseUrl` and `socketUrl` to your production HTTPS URLs.
2. Replace `src/services/billing.ts → mockPurchase` with a real
   `react-native-iap` flow:
   ```ts
   const purchase = await RNIap.requestSubscription({ sku: productId });
   return {
     platform: Platform.OS === 'ios' ? 'app_store' : 'google_play',
     productId,
     purchaseToken: purchase.purchaseToken,
   };
   ```
3. Configure FCM in Firebase Console; download `google-services.json` and add
   it via EAS (`eas credentials`). Set `GOOGLE_SERVICE_ACCOUNT_JSON` on the
   backend for server-side purchase validation.
4. Add your real icon/splash assets at `assets/icon.png`, `assets/splash.png`,
   `assets/adaptive-icon.png`.
5. Build → upload to Play Console → submit for review.
