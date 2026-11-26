# Taxi Lebanon: ride-hailing app (Expo / React Native)

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)

A ride-hailing app for passengers, drivers and admins, all in one codebase. The API is [taxi-lebanon-backend](https://github.com/ramizaiter1989/taxi-lebanon-backend) (Laravel 12 + Reverb).

## Features

- **Three roles, one app.** Expo Router route groups `(client)`, `(rider)` and `(admin)`, each with its own tab layout, chosen at sign-in.
- **Live rides.** Request a ride, see the driver move on the map (`react-native-maps`), and follow the active ride, trip history and driver earnings.
- **Realtime.** Laravel Echo over the Pusher protocol listens to ride and location events from Reverb. There is no polling.
- **In-ride chat** between passenger and driver.
- **Push notifications** with `expo-notifications`; the device token is registered with the API.
- **Auth.** Sign-up, OTP verification, password reset, driver profile completion.
- **i18n.** `react-i18next` with in-app language switching and device-locale detection.
- **State and data.** Zustand for app state, TanStack Query for server state, a typed API client in `services/`.

## Project layout

```
app/            Expo Router screens: (client) (rider) (admin), auth, chat, ride tracking
services/       api.ts, AuthService, NotificationService, chatService, echo.ts
providers/      MapProvider, UserProvider
components/ hooks/ constants/ types/ utils/
```

## Run locally

```bash
npm install
npx expo start          # Expo Go or a dev build
npx expo run:android    # native build
```

Set the API and WebSocket URLs in the app config before running.

## Author

**Rami Zeaiter**, Lead Full-Stack Developer & Tech Lead · [rami-z-company.com](https://rami-z-company.com)
