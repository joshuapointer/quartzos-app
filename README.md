# dabwith.me

> Bluetooth companion app for the **Dab Rite IR thermometer**. Pair, monitor temperature, and sync settings in real-time.

---

## Features

- **Real-time temperature monitoring** — Live updates from your Dab Rite via Bluetooth Low Energy
- **Session tracking & history** — Log and review your sessions with SQLite-backed storage
- **Customizable alerts** — Set temperature thresholds with sound and haptic feedback
- **Dark-first design** — Skia + Reanimated powered UI with OLED-friendly theming
- **Siri integration** — Voice shortcuts via `quartzie-siri-bridge` native module
- **Over-the-air updates** — Expo Updates for instant patches without App Store review
- **Background BLE** — Stay connected even when the app isn't in the foreground

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 (New Architecture) |
| UI | Skia, Reanimated 3, Expo Router |
| State | Zustand |
| Storage | SQLite (expo-sqlite) |
| Bluetooth | react-native-ble-plx |
| Build | EAS CLI ≥ 18.8.1 |

---

## Setup

```bash
# Install dependencies
pnpm install

# iOS — run on simulator or device
npx expo run:ios

# Android
npx expo run:android

# Or use EAS for cloud builds
eas build --profile development --platform ios
```

### Requirements

- Node.js ≥ 20 (see `.nvmrc`)
- pnpm ≥ 9
- Xcode 16+ (iOS)
- Android Studio + SDK 36 (Android)
- A physical iOS/Android device for BLE testing (simulators don't support Bluetooth)

---

## Documentation

- Product specs & architecture: [`docs/`](./docs)
- BLE protocol: [`docs/ble-protocol.md`](./docs/ble-protocol.md) *(device handles pairing auth)*

---

## Screenshots

*Coming soon — App Store screenshots will be added here.*

---

## Download

- [App Store](https://apps.apple.com/us/app/dabwith-me/placeholder) *(placeholder)*
- [TestFlight](https://testflight.apple.com/join/placeholder) *(placeholder)*

---

## License

MIT © Josh Pointer

---

*Built with 🔥 in Los Angeles*
