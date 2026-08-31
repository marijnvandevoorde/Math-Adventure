#!/usr/bin/env node
/* Copy the deployable files into dist/ for static hosts (Cloudflare Pages).
 * Keeps node_modules, TypeScript sources and tooling out of the deploy.
 *
 *   npm run build:dist
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const ITEMS = [
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "icons",
];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
for (const item of ITEMS) {
  fs.cpSync(path.join(ROOT, item), path.join(DIST, item), { recursive: true });
}
console.log("dist/ ready:", ITEMS.join(", "));
