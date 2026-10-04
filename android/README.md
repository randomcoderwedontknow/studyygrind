# StudyGrind — Android (Capacitor)

**Current release:** **12.3.0** (`versionCode` **12300**). Full notes: [RELEASE_NOTES_12.3.0.md](./RELEASE_NOTES_12.3.0.md).

This directory is the **Gradle project** you open in Android Studio. The UI is a **web app** built at the **repository root** (`../`), then copied here by Capacitor.

## 12.3.0 on Android (same as web)

All 12.3 features run inside the WebView: **daily shop economy**, **sell-back** (Shop → Owned), **Exams** (drawer / More menu), **recurring tasks**, **Preset Lab** shop unlock, **beta cleared on update** (migration v14). In-app **What's New** appears after update.

**Session keep-alive:** `MainActivity` pauses/resumes the WebView and avoids state-save reloads so switching apps for **~30 minutes** should not cold-refresh the UI (if Android keeps the process alive).

## Portable Gradle project (standalone `android/` folder)

- The **shipped UI** for this app lives under **`app/src/main/assets/public/`** (HTML, JS, CSS). **`capacitor.config.json`** and **`capacitor.plugins.json`** in the same **`assets`** folder configure the WebView and plugins.
- These assets are **checked into this repo** so you can copy or zip **`android/` only**, open it in Android Studio on another PC, install on your phone via **Run**, and still get the **full StudyGrind app** without installing Node first.
- **After you change the web source** (`../src/`, `../index.html`, etc.), run **`npm run android:sync`** from **repo root** (or Gradle task **`syncCapacitorWeb`**) and **commit the updated `app/src/main/assets/`** again before sharing—otherwise others get an old bundle.
- Kotlin/Java under `android/app/src/main/` is **not** where screens and game logic get edited day to day (unless you someday rewrite natively).

## Web vs native (Capacitor)

- **Screens, games, themes, mentor, ranks, flashcards** — implemented in **`../src/`** (React + CSS), built to `../dist`, then synced into **`app/src/main/assets/public/`** (tracked here for portability). Editing only Kotlin/XML here cannot change that UI without rewriting the whole app native.
- This **`android/`** tree is primarily the WebView shell, Gradle config, plugins, manifest, and the **`syncCapacitorWeb`** task that pulls the fresh bundle after you change the web source.

## Open in Android Studio

1. **File → Open** and select this folder: `studyygrind/android` (the folder that contains `settings.gradle`).
2. Wait for Gradle sync to finish.

## Prerequisites (once)

- **Android Studio** with a current Android SDK.
- **Node.js** and **npm**, available on your system `PATH` (Android Studio’s Gradle uses the same PATH as your user account).
- From the **repository root** (`studyygrind/`, one level above `android/`):

  ```bash
  npm install
  ```

## Workflow: refresh web app, then run

Whenever you change **`src/`**, **`index.html`**, or other web sources under the repo root:

1. In Android Studio: **Gradle** tool window → **app** → **Tasks** → **capacitor** → double-click **`syncCapacitorWeb`**.  
   - This runs `npm run android:sync` from the repo root (same as `npm run build` + `cap sync android`).

   **Or**, from the repo root in a terminal:

   ```bash
   npm run android:sync
   ```

2. **Run** the app (Shift+F10 / Run ▶).

You do **not** need `syncCapacitorWeb` on every run if only **Kotlin/Java/Android resources** changed and the web bundle is already up to date.

## Do not edit generated assets by hand

The bundle under **`app/src/main/assets/public/`** and **`capacitor*.json`** are **output** from Capacitor: they are overwritten on the next **`android:sync`**. Change the app in **`../src/`** at the repo root, sync, then commit the updated **`assets/`** when you want to ship a new UI in a portable **android** folder.

## Troubleshooting

- **`syncCapacitorWeb` fails with “npm not found”**  
  Ensure Node/npm are on PATH for the user that launches Android Studio (restart the IDE after installing Node).

- **Old UI on device**  
  Run **`syncCapacitorWeb`** (or `npm run android:sync`), then uninstall the app or do a clean install if caches cause confusion.

- **Build error about `config.xml` or plugins**  
  If **`app/src/main/res/xml/config.xml`** is missing, run **`npm run android:sync`** from repo root once (requires Node). That file is regenerated and may remain gitignored while the **WebView bundle in `assets/`** stays checked in.
