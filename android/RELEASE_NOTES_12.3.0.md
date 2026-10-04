# StudyGrind 12.3.0 — Android release notes

This APK ships the same web bundle as `dist/` (Capacitor WebView). Version: **12.3.0** (`versionCode` **12300**).

## Beta program

- On first launch after update, **migration v14** clears beta access for **every account** (including owner): no beta shell, no beta program flags.
- **Preset Lab**, **Routines**, and **Goals** are no longer beta-only; beta entry UI stays off while `BETA_PROGRAM_PUBLIC` is false.

## Preset Lab (shop)

- **Preset Lab** is a **Pages & labs** shop unlock (~**50,000** focus points, daily economy price applies).
- Timer still works without the unlock; **Preset Lab** page and saving extra presets require purchase.
- Menu: **Timer → Preset Lab** (or drawer). Locked users are sent to the shop.

## Daily shop economy

- Paid items (hubs, unlocks, titles, themes, games) use **today’s market price** (resets at midnight local time).
- Prices move about **−50,000 to +20,000** from the scaled base, with **floors** so expensive items never crash to trivial prices.
- **Daily deal** and theme/title modals use the same economy rules.

## Sell back & Owned tab

- **Shop → Owned** shows **everything you own**: pages/hubs, display titles (including Custom Name), theme Normal/Liquid, and other unlocks.
- **Sell** refunds **today’s market price** in focus points (no resale fee).
- Equipped theme/title/sound resets safely when sold.

## Exams

- New **Exams** page in the drawer (Android bottom nav: **More → Exams**).
- Add exams, countdown, minutes studied, **Study** opens the timer linked to that exam.
- Exam readiness prompts unchanged (after exam date).

## Recurring tasks

- **Tasks → New/Edit → Recurring task**: **Every day** (with end date) or **Pick dates** (e.g. specific days in October).
- **Done for [date]** on each occurrence; move to **Done** only when all scheduled days are complete.

## Other (12.2.9 → 12.3)

- Numeric fields allow clear/backspace while editing (timer, tasks, onboarding, shop owner tools).
- What’s New modal lists highlights on first open after update.

## Android shell (12.3.0)

- WebView tuned to **stay warm for ~30 minutes** when you switch apps (pause/resume timers, cache, retain task state).
- See `MainActivity.java` and `@string/release_notes_background_grace`.

## Build in Android Studio

1. Open folder `studyygrind/android`.
2. If web source changed: run **`syncCapacitorWeb`** (Gradle) or from repo root: `npm run android:sync`.
3. **Run** ▶ or **Build → Generate Signed Bundle/APK**.
