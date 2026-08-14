#!/bin/sh
# Xcode build phase: copy the PWA build output into the app bundle as www/.
#
# ../dist stays the single source of truth for the web app — the iOS project
# never keeps its own copy. Run `npm run build:dist` in the repo root first;
# this fails the build loudly rather than shipping an empty shell.
set -eu

DIST="${SRCROOT}/../dist"
DEST="${BUILT_PRODUCTS_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/www"

if [ ! -f "${DIST}/index.html" ]; then
  echo "error: ${DIST}/index.html not found — run 'npm run build:dist' in the repo root." >&2
  exit 1
fi

mkdir -p "${DEST}"
# --delete keeps the bundle in step with dist when a file is removed.
# sw.js is excluded: the scheme handler already serves everything locally, and
# a service worker on top would only add a second, staler cache.
rsync -a --delete --exclude 'sw.js' "${DIST}/" "${DEST}/"

echo "Synced $(find "${DEST}" -type f | wc -l | tr -d ' ') web files into the bundle."
