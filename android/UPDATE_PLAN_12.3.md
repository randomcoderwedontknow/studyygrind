# StudyGrind 12.3 — update plan (implemented)

Checklist from the 12.3 product plan and your requests. All items ship in the synced WebView bundle unless noted as native.

## Scope

| # | Item | Status |
|---|------|--------|
| 1 | **DATA_VERSION 14** — strip beta for all users (owner included); no beta backfill | Done (`src/lib/migrations.ts`) |
| 2 | **Preset Lab** — shop unlock ~50k, page-access, route, purchase flow | Done |
| 3 | **Daily economy** — bounded daily price swings, floors/ceilings | Done (`economy-pricing.ts`) |
| 4 | **Sell-back** — sell at today's price; titles, custom name, themes | Done |
| 5 | **Owned tab** — full inventory (hubs, titles, themes, unlocks) | Done |
| 6 | **Exams page** — CRUD, countdown, study → timer | Done (drawer / **More → Exams**) |
| 7 | **Recurring tasks** — daily or picked dates, per-day completion | Done |
| 8 | **What's New** — in-app modal + Android `release_notes_12_3.xml` | Done |
| 9 | **Numeric inputs** — backspace/retype while editing (12.2.x carryover) | Done |
| 10 | **Android 30 min session** — no cold refresh when switching apps | Done (`MainActivity.java`, manifest) |
| 11 | **Capacitor sync** — `dist/` → `android/app/src/main/assets/public` | Run before Studio build |

## Your navigation notes (Android)

- **Exams** and **Preset Lab** are not on the bottom tab bar; use the **drawer** (**More**).
- After install, open **Shop → Owned** to sell items; **Shop** for Preset Lab unlock.

## Version pins

- App: `12.3.0` — `package.json`, `constants.ts`
- Android: `versionName "12.3.0"`, `versionCode 12300` — `app/build.gradle`

## Build

```bash
npm run android:sync
```

Then open **`android/`** in Android Studio → Run.
