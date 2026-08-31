#!/bin/zsh
# Capture App Store screenshots from the iOS simulators.
#
#   ./capture-ios.sh [scene ...]
#
# Builds the debug app once, then for each simulator below boots it, drives the
# app through each scene (see scenes.js) and grabs a screenshot. Output lands in
# ./ios/<profile>/<scene>.png.
#
# The device list covers the sizes App Store Connect asks for. A 6.9" iPhone
# set plus a 13" iPad set is all that is required; the 6.3" iPhone is extra
# material to choose from.
#   6.9" iPhone  1320x2868 portrait / 2868x1320 landscape
#   6.3" iPhone  1206x2622 portrait / 2622x1206 landscape
#   13"  iPad    2064x2752 portrait / 2752x2064 landscape
set -euo pipefail

HERE=${0:A:h}
ROOT=${HERE:h:h}
PROJ=$ROOT/ios/MathAdventure.xcodeproj
BUNDLE_ID=co.smallvictories.mathadventure
OUT=$HERE/ios
DERIVED=$ROOT/ios/build
SCENE_TIMEOUT=45

# profile|simulator name|orientation
DEVICES=(
  "iphone-6.9-portrait|iPhone 17 Pro Max|portrait"
  "iphone-6.9-landscape|iPhone 17 Pro Max|landscape"
  "iphone-6.3-portrait|iPhone 17|portrait"
  "iphone-6.3-landscape|iPhone 17|landscape"
  "ipad-13-portrait|iPad Pro 13-inch (M4)|portrait"
  "ipad-13-landscape|iPad Pro 13-inch (M4)|landscape"
)

SCENES=(
  home reeksen reeksen_typed reeksen_correct reeksen_streak
  settings settings_full
  splits_setup splits_play splits_typed splits_progress splits_win
  home_en reeksen_en settings_en
)
[[ $# -gt 0 ]] && SCENES=("$@")

SCENE_LIB=$(base64 < "$HERE/scenes.js" | tr -d '\n')

echo "==> Building the app"
(cd "$ROOT" && npm run build:dist >/dev/null)
xcodebuild -project "$PROJ" -scheme MathAdventure -configuration Debug \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO build >/dev/null
APP=$DERIVED/Build/Products/Debug-iphonesimulator/MathAdventure.app
[[ -d $APP ]] || { echo "Build produced no app bundle." >&2; exit 1; }

# Resolve a simulator name to a udid, preferring the newest runtime it exists on.
udid_for() {
  xcrun simctl list devices available -j \
    | python3 -c '
import json,sys
name=sys.argv[1]
data=json.load(sys.stdin)["devices"]
best=None
for runtime, devices in data.items():
    if "iOS" not in runtime: continue
    for d in devices:
        if d["name"] == name:
            key=[int(p) for p in runtime.rsplit(".",1)[-1].replace("-",".").split(".") if p.isdigit()]
            if best is None or key > best[0]: best=(key, d["udid"])
print(best[1] if best else "")' "$1"
}

failed=()

for entry in $DEVICES; do
  profile=${entry%%|*}; rest=${entry#*|}
  device=${rest%%|*};   orientation=${rest##*|}

  udid=$(udid_for "$device")
  if [[ -z $udid ]]; then
    echo "==> $profile: no simulator named '$device' — skipping" >&2
    failed+=("$profile (missing simulator)")
    continue
  fi

  echo "==> $profile ($device, $orientation)"
  mkdir -p "$OUT/$profile"

  xcrun simctl boot "$udid" 2>/dev/null || true
  xcrun simctl bootstatus "$udid" -b >/dev/null 2>&1 || true
  # Fixed status bar, in case a future layout ever shows it.
  xcrun simctl status_bar "$udid" override \
    --time "9:41" --batteryState charged --batteryLevel 100 \
    --cellularMode active --cellularBars 4 --wifiBars 3 2>/dev/null || true
  xcrun simctl install "$udid" "$APP" >/dev/null

  for scene in $SCENES; do
    # Reinstall per scene so each one starts from a zero-star app in Dutch.
    # Without this the language picked by home_en/settings_en survives in
    # localStorage and silently turns later Dutch scenes English.
    xcrun simctl terminate "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
    xcrun simctl uninstall "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
    xcrun simctl install "$udid" "$APP" >/dev/null

    container=$(xcrun simctl get_app_container "$udid" "$BUNDLE_ID" data)
    status_file="$container/Documents/scene-status.txt"
    rm -f "$status_file"

    xcrun simctl launch "$udid" "$BUNDLE_ID" \
      -sceneLibrary "$SCENE_LIB" -sceneName "$scene" \
      -sceneOrientation "$orientation" >/dev/null

    # The app writes DONE/FAIL to its Documents dir once the state is on screen.
    scene_status=""
    for _ in {1..$((SCENE_TIMEOUT * 5))}; do
      [[ -f $status_file ]] && { scene_status=$(<"$status_file"); break; }
      sleep 0.2
    done

    case "$scene_status" in
      DONE*)
        sleep 0.3
        shot="$OUT/$profile/$scene.png"
        xcrun simctl io "$udid" screenshot --type=png "$shot" >/dev/null 2>&1
        # The app rotates its own UI, but the simulated device frame stays
        # portrait, so a landscape capture comes out sideways in a portrait
        # image. Rotating the file gives a true landscape screenshot at the
        # dimensions App Store Connect expects.
        [[ $orientation == landscape ]] && sips --rotate 270 "$shot" >/dev/null
        echo "    $scene" ;;
      FAIL*)
        echo "    !! $scene_status" >&2; failed+=("$profile/$scene") ;;
      *)
        echo "    !! $scene timed out" >&2; failed+=("$profile/$scene") ;;
    esac
  done

  xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true
done

if (( ${#failed} )); then
  echo "==> ${#failed} scene(s) failed: ${failed[*]}" >&2
  exit 1
fi
echo "==> Done: $OUT"
