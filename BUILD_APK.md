# Building StudyGrind as an Android APK

This project is wrapped with [Capacitor](https://capacitorjs.com/), so the same React/Vite web app you run with `npm run dev` can be packaged as a native Android APK. Once built, the APK is a real app you can sideload on any Android phone - no Play Store, no domain, no internet required (Supabase sync just runs whenever you do have a connection).

## One-time setup on your computer

1. **Install Android Studio**
   Download: <https://developer.android.com/studio>
   During first launch the SDK Manager will prompt you to install the Android SDK. Make sure all of these are checked:
   - Android SDK Platform 34 (or higher)
   - Android SDK Build-Tools 34.0.0+
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools (latest)
   - Android Emulator (optional, only if you want to test in a virtual phone)

2. **Install JDK 17**
   Android Studio bundles a JDK, but if Gradle ever complains, grab Eclipse Temurin 17: <https://adoptium.net/temurin/releases/?version=17>
   On Windows, set `JAVA_HOME` to that JDK path in your system environment variables.

3. **Verify with `npx cap doctor`** (run from the project root):
   ```bash
   npx cap doctor
   ```
   You want a clean output for the `android` block.

## Build the APK (every time you change code)

From the project root (`c:\Users\Abdullah ahmed\studyygrind`):

```bash
npm install                # only needed once or after pulling new deps
npm run icons              # only needed if you changed the logo SVGs in assets/
npm run android:sync       # builds dist/ and pushes it into the android/ project
npm run android:open       # opens the android/ project in Android Studio
```

Then in Android Studio:

1. Wait for **Gradle sync** to finish (status bar at the bottom). First sync downloads ~500 MB.
2. Top menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
3. When the green toast appears, click **locate** in it (or look here):
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

That `app-debug.apk` is your installable file.

## Install the APK on your phone

Pick whichever path is easiest:

- **USB cable**: enable Developer Options + USB debugging on the phone, then in Android Studio click the green **Run** button while your phone is plugged in. It installs and launches automatically.
- **No cable**: copy `app-debug.apk` to the phone (Drive, Telegram, email, anything). Tap it. Android will warn "Install unknown apps" - allow it for whichever app opened the file. Tap Install.

The first launch shows the dark splash with the green StudyGrind badge, then drops you straight into the app. Owner login (`abdullahahmed` / `owner`) works exactly the same as on the web.

## Release / signed APK (only when you want a permanent build)

Debug APKs expire after a year and aren't ideal for long-term use. For a signed release APK:

1. **Build -> Generate Signed Bundle / APK** in Android Studio.
2. Pick **APK**, then **Create new...** keystore. Save the .jks somewhere safe (don't commit it).
3. Fill in alias + passwords - any values are fine, just remember them.
4. Variant: `release`. Click Finish.
5. Output: `android/app/build/outputs/apk/release/app-release.apk`.

Reuse the same keystore for every future update so Android recognises it as the same app.

## Troubleshooting

- **Gradle sync fails on first open**: usually the SDK isn't installed. Open Android Studio's SDK Manager and install Android 34 + Build-Tools 34.0.0.
- **`SDK location not found`**: open `android/local.properties` (auto-generated) and set `sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (use double backslashes).
- **App opens to a white screen**: run `npm run android:sync` again - the `dist/` folder probably wasn't fresh.
- **Supabase calls fail in the APK**: confirm the phone has internet. The app itself works fully offline; sync just pauses until reconnect.
- **Phone refuses to install**: enable "Install from unknown sources" for the file-manager / browser app you used to transfer the APK.
- **Logo or splash didn't update**: re-run `npm run icons`, then `npm run android:sync`.

## What's inside the `android/` folder

A normal Android Studio Gradle project:
- `android/app/src/main/assets/public/` - your built React app (`dist/` contents)
- `android/app/src/main/res/mipmap-*` - the StudyGrind launcher icons
- `android/app/src/main/res/drawable*` - splash screens
- `android/app/src/main/AndroidManifest.xml` - permissions, package id (`app.studyygrind.app`), launch activity

Do not edit those by hand if you can avoid it - they're rewritten on every `cap sync`.
