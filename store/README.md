# Shipping Rekenavontuur to the Play Store and the App Store

Everything in this directory is submission material: store copy, graphics,
screenshots, and the compliance answers. The apps themselves live in
[`../android`](../android) and [`../ios`](../ios).

**What is built and verified**

| | Android | iOS |
| --- | --- | --- |
| Shell | Java + `WebView` | Objective-C + `WKWebView` |
| Web app | bundled in the binary, served from `assets/www` | bundled in the binary, served from `www/` |
| Serves over | `https://appassets.androidplatform.net/` | `rekenavontuur://app/` |
| Network access | **none** — no `INTERNET` permission is declared | **none** — no requests are made |
| Minimum OS | Android 7.0 (API 24) | iOS 15.0 |
| Target | API 36 | iOS 26 SDK |
| Verified | release AAB + APK build, R8-minified, runs on emulator | Debug + Release build, runs on simulator |

The game is **embedded, not proxied**. Neither app can reach
`math-adventures.small-victories.co`; both work with the device in aeroplane
mode. `../dist` is the single source of truth — `npm run build:dist` at the repo
root, and both projects pick it up on their next build.

---

## ⚠️ Pricing at $0.50 — check the floor first

The intended price is **50 cents**. That sits right at the bottom of what both
stores allow, so it needs checking before you commit to it:

1. **App Store: $0.50 is not a valid price point.** Apple's range runs from
   $0.29 upward in $0.10 steps below $10 — so the points either side are
   **$0.49** and $0.59. Pick $0.49.
2. **Play: the minimum is country-specific.** Google sets a separate floor per
   country (as low as ~$0.21 in India, ~$0.45 in Poland), and in several
   markets — the US among them, historically — the floor has been $0.99. Play
   Console → *Monetise → Products → App pricing* shows the allowed range for
   each currency; check it before assuming $0.49 is available everywhere. Where
   it is not, you either raise the price for that country or delist it.
3. **Paid apps still need a payments profile,** even at 50 cents. Google Play
   requires a **merchant account** linked to the developer account; Apple
   requires the **Paid Applications Agreement** plus banking and tax details.
   Both take days, not minutes, and the app cannot be submitted as paid until
   they are active. Start them now if you have not.
4. **Worth a sanity check at this price:** the stores take roughly 15–30% and
   both accounts cost money to hold ($25 once for Play, $99/year for Apple). At
   $0.49 the Apple membership alone needs a few hundred sales a year to break
   even. That may well be fine — a token price is a reasonable way to offer the
   app-store convenience version of something that is also free on the web at
   `math-adventures.small-victories.co` — but it is worth being deliberate
   about rather than discovering later.

Nothing else in this directory assumes a price: the listings never mention one,
so changing your mind is a single field in each console.

---

## What I could not do for you

**I cannot publish either app.** Publishing needs credentials I do not have and
should not create:

- Google Play Console access for your developer account, plus a merchant
  profile.
- An Apple Developer Program membership, a Distribution certificate, and an App
  Store Connect account.

Both are also irreversible, outward-facing acts — a published app is public, and
a submitted binary cannot be un-reviewed. So the pipeline stops at "signed
artifact ready to upload".

**If you want the upload automated too**, it can be. Give me either of these and
I will wire it up:

- **Play**: a Google Cloud service-account JSON with the *Release manager* role
  in Play Console. Then `bundletool`/the Play Developer API can push an AAB to
  the internal test track from the command line.
- **App Store**: an App Store Connect API key (Issuer ID, Key ID, `.p8` file)
  with *App Manager* access. Then `xcrun altool`/`notarytool` can upload builds.

Even then, the final "roll out to production" button is worth keeping human.

---

## Assets in this directory

```
store/
├── assets/
│   ├── play-icon-512.png              Play listing icon (512×512)
│   ├── feature-graphic-1024x500.png   Play feature graphic, Dutch (required)
│   └── feature-graphic-en-1024x500.png  … and English
├── play/listing-nl.md, listing-en.md  Play store copy, ready to paste
├── appstore/listing-nl.md, listing-en.md  App Store copy, ready to paste
├── privacy-policy.md                  Needs hosting; both stores require a URL
├── compliance-answers.md              Data safety, content rating, App Privacy
└── screenshots/
    ├── scenes.js                      Drives the app into each screenshot state
    ├── capture-android.sh             Re-shoot everything on Android
    ├── capture-ios.sh                 Re-shoot everything on iOS
    ├── android/<profile>/<scene>.png
    └── ios/<profile>/<scene>.png
```

The iOS app icon comes from the asset catalogue in the app itself; App Store
Connect pulls it from the uploaded build, so there is nothing to upload
separately.

### Screenshots

15 scenes per device profile, all captured from the real app driven through its
own UI — nothing is mocked up. Pick your favourites; you do not need all of
them.

| Scene | Shows |
| --- | --- |
| `home` | Game picker |
| `reeksen` | A fresh sum with the numpad |
| `reeksen_typed` | An answer entered, ✓ not yet pressed |
| `reeksen_correct` | Confetti and praise on a correct answer |
| `reeksen_streak` | Five in a row: 5 stars, 5 flame streak |
| `settings` / `settings_full` | Settings; the second with all four operations on and the ceiling at 50 |
| `splits_setup` | Choose 5 / 10 / surprise |
| `splits_play` / `splits_typed` | The split diagram, empty and filled |
| `splits_progress` | 6/10 through a run |
| `splits_win` | Trophy screen with confetti |
| `home_en`, `reeksen_en`, `settings_en` | The same app in English |

Android profiles: `phone-portrait` (1080×1920), `phone-landscape` (1920×1080),
`tablet7-portrait` (1200×1920), `tablet10-portrait` (1600×2560),
`tablet10-landscape` (2560×1600).

iOS profiles: `iphone-6.9-portrait` (1320×2868), `iphone-6.9-landscape`
(2868×1320), `iphone-6.3-portrait` (1206×2622), `iphone-6.3-landscape`
(2622×1206), `ipad-13-portrait` (2064×2752), `ipad-13-landscape` (2752×2064).

Every size is one the respective store accepts as-is. To re-shoot after a UI
change: boot an Android emulator or leave the simulators to the script, then

```sh
cd store/screenshots
./capture-android.sh          # or: ./capture-android.sh splits_win
./capture-ios.sh
```

---

## Google Play — step by step

### 1. One-time account setup

- [ ] Google Play Developer account (one-off $25) at
      <https://play.google.com/console>.
- [ ] **Merchant account** linked — required before the app can be paid.
      Play Console → *Setup → Payments profile*.

### 2. Create the upload key (once, on your machine)

```sh
cd android
./make-upload-key.sh
```

Creates `upload-keystore.jks` and `keystore.properties`, both git-ignored.
**Back them up.** Without the key you cannot ship updates.

I deliberately did not run this — it mints a credential that outlives the
project, and that should be your call.

### 3. Build the release bundle

```sh
npm run build:dist                       # from the repo root
cd android && ./gradlew :app:bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```

With `keystore.properties` present the bundle is signed automatically. Without
it, Gradle still builds but leaves the bundle unsigned and Play will reject it.

### 4. Create the app in Play Console

Play Console → *Create app*.

| Field | Value |
| --- | --- |
| App name | `Rekenavontuur – Rekenen 6-9` |
| Default language | Dutch (Netherlands) |
| App or game | **Game** (it is a game; Education is still the category) |
| Free or paid | **Paid** |

> The **package name is `co.smallvictories.rekenavontuur` and is permanent.**
> Once an app with that name is published it can never be renamed or reused.
> If you want something different, change `applicationId` in
> `android/app/build.gradle.kts` and `namespace` to match — but do it *now*.

### 5. Fill in the console

- [ ] **Main store listing** — copy from `play/listing-nl.md`, then add English
      from `play/listing-en.md`. ⚠️ You must supply a **contact email** and a
      **privacy policy URL**.
- [ ] **Graphics** — app icon `assets/play-icon-512.png`, feature graphic
      `assets/feature-graphic-1024x500.png`, at least 2 phone screenshots (Play
      allows up to 8 per device type) and, to be listed as tablet-optimised,
      tablet screenshots too.
- [ ] **App content** — every questionnaire is answered in
      `compliance-answers.md`: privacy policy, ads (none), data safety (nothing
      collected), content rating, target audience (6–8 and 9–12, which puts the
      app in the **Families programme**), news (no), advertising ID (not used).
- [ ] **Pricing** — set the price per country, checking each currency against
      Play's per-country minimum (see the pricing note at the top; $0.49 is
      below the floor in some markets). Set it before the first production
      release: an app published as free **can never be switched to paid**.
- [ ] **Countries** — pick where it sells.

### 6. Release

Upload the AAB to **Internal testing** first and install it on a real device
from the tester link. Then promote to Production. First review is typically a
few days; new developer accounts also need ~14 days of closed testing with
testers before production is unlocked.

---

## App Store — step by step

### 1. Account setup

- [ ] Apple Developer Program membership — **$99/year, recurring** (billed in
      local currency plus VAT). Unlike Play's one-off $25, this renews: if the
      membership lapses, the app is **removed from the App Store** until it is
      paid again. The fee is the same whether the app is free or paid, so it is
      really the cost of having an App Store listing at all.
- [ ] Enrol in the [Small Business Program](https://developer.apple.com/app-store/small-business-program/)
      — drops Apple's commission from 30% to 15% under $1M/year. It is a short
      form and applies from the following month, so do it before launch.
- [ ] Decide **Individual vs Organization** enrolment. Individual is fast but
      lists your personal name publicly as the seller; Organization shows the
      company name but needs a D-U-N-S number, which can take a couple of weeks
      to obtain. Changing later means a new enrolment, so pick deliberately.
- [ ] **Paid Applications Agreement** accepted, with banking and tax details, in
      App Store Connect → *Business*.

### 2. Set your team in the Xcode project

`DEVELOPMENT_TEAM` is intentionally blank. Either set it in Xcode (*Signing &
Capabilities* → Team, with *Automatically manage signing* on), or put your Team
ID into both target configurations in
`ios/Rekenavontuur.xcodeproj/project.pbxproj`.

The bundle identifier is `co.smallvictories.rekenavontuur`, matching Android. As
on Play it is permanent once used — change it now if you want something else.

### 3. Register the app

- [ ] <https://developer.apple.com/account/resources/identifiers> → register the
      App ID `co.smallvictories.rekenavontuur`. No capabilities needed.
- [ ] App Store Connect → *My Apps → +* → New App. Platform iOS, Dutch as
      primary language, SKU anything (e.g. `rekenavontuur-1`).

### 4. Archive and upload

```sh
npm run build:dist                       # from the repo root
cd ios
xcodebuild -project Rekenavontuur.xcodeproj -scheme Rekenavontuur \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/Rekenavontuur.xcarchive archive
```

Then Xcode → *Window → Organizer* → *Distribute App → App Store Connect*. This
step needs your Distribution certificate, which is why it cannot be scripted
from here without your credentials.

### 5. Fill in App Store Connect

- [ ] **Listing** — copy from `appstore/listing-nl.md` and `listing-en.md`.
      ⚠️ A **support URL** is required and must resolve.
- [ ] **Screenshots** — 6.9" iPhone and 13" iPad sets are required for a
      universal app; use `screenshots/ios/iphone-6.9-*` and
      `screenshots/ios/ipad-13-*`. Up to 10 per size.
- [ ] **App Privacy** — "Data Not Collected" for everything; see
      `compliance-answers.md`.
- [ ] **Age rating** — answer No throughout; expect 4+. Decide whether to opt
      into the **Kids Category** (the app qualifies; see the note in
      `compliance-answers.md`).
- [ ] **Pricing** — Apple uses fixed price points and $0.50 is not one of them;
      **$0.49** is the nearest (the floor is $0.29).
- [ ] **Review notes** — worth writing: *"The app is fully offline and contains
      no accounts, purchases or links. No sign-in is needed to review it."*

---

## Updating later

1. Change the web app, then `npm run build:dist`.
2. Android: bump `versionCode` (must increase) and `versionName` in
   `android/app/build.gradle.kts`, then `./gradlew :app:bundleRelease`.
3. iOS: bump `CURRENT_PROJECT_VERSION` (build number, must increase) and
   `MARKETING_VERSION` in the project, then archive again.

Both shells are thin enough that ordinary web-app changes need no native work at
all.
