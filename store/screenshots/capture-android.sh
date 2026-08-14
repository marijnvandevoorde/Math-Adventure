#!/bin/zsh
# Capture Play Store screenshots from a running Android emulator.
#
#   ./capture-android.sh [scene ...]
#
# Builds and installs the debug APK, then for each device profile below resizes
# the emulator, drives the app into each scene (see scenes.js) and grabs a
# screenshot. Output lands in ./android/<profile>/<scene>.png.
#
# The emulator must already be booted. Profiles are chosen so every image comes
# out at a resolution Play accepts without any cropping afterwards. The app
# itself runs fully immersive, so the shots have no status or navigation bar.
set -euo pipefail

HERE=${0:A:h}
ROOT=${HERE:h:h}
ADB=${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb
PKG=co.smallvictories.rekenavontuur.debug
ACT=$PKG/co.smallvictories.rekenavontuur.MainActivity
OUT=$HERE/android
SCENE_TIMEOUT=45          # seconds to wait for a scene to report back

# profile:width:height:density
PROFILES=(
  "phone-portrait:1080:1920:420"
  "phone-landscape:1920:1080:420"
  "tablet7-portrait:1200:1920:280"
  "tablet10-landscape:2560:1600:280"
  "tablet10-portrait:1600:2560:280"
)

SCENES=(
  home reeksen reeksen_typed reeksen_correct reeksen_streak
  settings settings_full
  splits_setup splits_play splits_typed splits_progress splits_win
  home_en reeksen_en settings_en
)
[[ $# -gt 0 ]] && SCENES=("$@")

$ADB get-state >/dev/null 2>&1 || { echo "No emulator/device attached." >&2; exit 1; }

echo "==> Building and installing the debug APK"
(cd "$ROOT" && npm run build:dist >/dev/null)
(cd "$ROOT/android" && JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}" \
  ./gradlew -q :app:assembleDebug)
$ADB install -r -d "$ROOT/android/app/build/outputs/apk/debug/app-debug.apk" >/dev/null

# Waits for the scene to log SCENE_DONE / SCENE_FAIL rather than sleeping a
# guessed interval — splits_win plays ten full rounds and takes ~15s.
await_scene() {
  local scene=$1 waited=0 log=""
  while (( waited < SCENE_TIMEOUT * 5 )); do
    log=$($ADB logcat -d -s RekenavontuurWeb 2>/dev/null) || log=""
    case "$log" in
      *"SCENE_DONE $scene"*) return 0 ;;
      *"SCENE_FAIL $scene"*)
        echo "    !! ${${log##*SCENE_FAIL }%%$'\n'*}" >&2
        return 1 ;;
    esac
    sleep 0.2
    (( waited += 1 ))
  done
  echo "    !! $scene timed out after ${SCENE_TIMEOUT}s" >&2
  return 1
}

failed=()

for profile in $PROFILES; do
  name=${profile%%:*}; rest=${profile#*:}
  w=${rest%%:*};       rest=${rest#*:}
  h=${rest%%:*};       density=${rest##*:}

  echo "==> $name (${w}x${h} @ ${density}dpi)"
  mkdir -p "$OUT/$name"
  $ADB shell wm size "${w}x${h}" >/dev/null
  $ADB shell wm density "$density" >/dev/null
  sleep 2

  for scene in $SCENES; do
    captured=0
    # Two goes: cold-starting straight after `pm clear` occasionally loses the
    # intent, and a scene is cheap to replay.
    for attempt in 1 2; do
      $ADB shell pm clear "$PKG" >/dev/null   # every scene starts at zero stars
      $ADB logcat -c >/dev/null 2>&1 || true
      sleep 1

      # The app injects its bundled scene library on page load and runs
      # whatever scene the intent names.
      $ADB shell am start -n "$ACT" --es scene "$scene" >/dev/null

      if await_scene "$scene"; then
        $ADB shell screencap -p /sdcard/_shot.png
        $ADB pull /sdcard/_shot.png "$OUT/$name/$scene.png" >/dev/null
        echo "    $scene"
        captured=1
        break
      fi
      (( attempt == 1 )) && echo "    .. retrying $scene" >&2
    done
    (( captured )) || failed+=("$name/$scene")
  done
done

$ADB shell wm size reset >/dev/null; $ADB shell wm density reset >/dev/null

if (( ${#failed} )); then
  echo "==> ${#failed} scene(s) failed: ${failed[*]}" >&2
  exit 1
fi
echo "==> Done: $OUT"
