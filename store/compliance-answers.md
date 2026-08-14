# Compliance questionnaires — prepared answers

Every answer below follows from one fact: the app ships the whole game inside
the binary, has no network access, and stores only settings and a star count in
local storage. Verify each against the build before submitting — you are the one
signing the declaration.

---

## Google Play — Data safety

**Grow → Store presence → Data safety**

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | N/A (nothing is collected or transmitted) |
| Do you provide a way for users to request that their data be deleted? | N/A (no data is collected) |

Play may still ask you to confirm the app has no ads library and no analytics —
it has neither. The declared APK/AAB permission list is empty, which Play
cross-checks against these answers.

## Google Play — Advertising ID declaration

**No**, the app does not use an advertising ID. (No `AD_ID` permission is
declared in the manifest.)

## Google Play — Content rating (IARC questionnaire)

Category: **Reference, News, or Educational**

| Question | Answer |
| --- | --- |
| Violence, sexuality, language, controlled substances, crude humour | No to all |
| Gambling or simulated gambling | No |
| Does the app share the user's location with other users? | No |
| Does the app allow users to interact or exchange content? | No |
| Does the app allow the purchase of digital goods? | No |
| Does the app contain ads? | No |

Expected outcome: PEGI 3 / ESRB Everyone / USK 0.

## Google Play — Target audience and content

- Target age groups: **6–8** and **9–12** (the app is aimed at 6–9).
- Because children are a target audience, the app enters the **Families
  programme**: it must meet the Families policy (it does — no ads, no data
  collection, no external links) and needs a privacy policy URL.
- Store listing must not contain any call to action aimed at children.

## Google Play — Government apps / financial features / health

No to all.

## Google Play — News app

No.

---

## App Store — App Privacy ("nutrition label")

**App Store Connect → App Privacy**

Answer: **"Data Not Collected"** for every category. That single choice produces
the "Data Not Collected" label and skips all follow-up questions.

## App Store — Age rating

Answer **None / No** to every content question. Expected outcome: **4+**.

Additional questions:

| Question | Answer |
| --- | --- |
| Made for Kids? | **Yes — Ages 6–8** (optional; see the note below) |
| Unrestricted web access | No |
| Gambling | No |

> **Note on "Made for Kids":** opting into the Kids Category is genuinely
> optional. It gets the app better placement with parents, but it commits you to
> Apple's stricter kids rules (no third-party analytics or ads — both already
> true here) and to a parental gate on anything leading outside the app. The app
> has no outbound links, so it qualifies as-is. If you would rather keep the
> submission simple, leave it off; nothing else changes.

## App Store — Export compliance

`ITSAppUsesNonExemptEncryption` is already set to `false` in `Info.plist`, so
App Store Connect will not ask. The app uses no encryption beyond what the OS
provides.

## App Store — Content rights

The app contains no third-party content. Icons and UI are original; the mascots
are system emoji rendered by the device's own font.
