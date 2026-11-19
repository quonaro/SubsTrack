# SubsTrack

Local-first subscription tracker: Vue 3 + TypeScript + Reka UI frontend,
wrapped with Capacitor 8.5 for Android. No backend — all data lives in
on-device SQLite and survives app updates. UI is in Russian.

## Commands

- `pnpm install` — install deps
- `pnpm dev` — Vite dev server on :7358 (browser uses sql.js + IndexedDB —
  same SQL as native; `scripts/copy-wasm.mjs` copies `sql-wasm.wasm` into
  `public/assets/` via the `predev`/`prebuild` hooks)
- `pnpm build` — wasm copy + typecheck + `vite build` → `dist/`
- `pnpm typecheck` — vue-tsc
- `pnpm lint` — Biome check; `pnpm lint:fix` — apply safe fixes.
  Style: single quotes, no semicolons, trailing commas, 2-space indent
  (`biome.json`). `noUnusedImports`/`noUnusedVariables` are off for `*.vue`.
- `pnpm test` — Vitest (jsdom): pure domain logic + real-SQLite tests
  through `src/db/testdb.ts` (in-memory sql.js with `PRAGMA foreign_keys
  = ON`, matching the native/jeep backends)
- `pnpm cap:sync` — build web bundle and sync into `android/`
- `pnpm cap:android` — sync + open Android Studio (needs Android SDK)

Same commands are wrapped in `lota.yml` (`lota dev web|android`,
`lota build web|apk|apk:release`, `lota test`, `lota lint`,
`lota cap sync|android`, `lota push [tag]`). `lota dev android` does
live-reload: boots an AVD if none is connected, rebuilds the web bundle,
(re)uses vite on :7358 and runs `cap run android --live-reload` with
`adb reverse`. The installed APK keeps `server.url` baked in until a
normal build is reinstalled (`cap sync android && gradlew installDebug`).
`lota push [tag]` pushes main; with a `v*.*.*` tag it also pushes the tag,
which triggers the GitHub release workflow.

## CI/CD

`.github/workflows/ci.yml` runs on pushes to `main` and on PRs, in three
parallel jobs: `lint` (`biome ci`), `typecheck` (`pnpm typecheck`),
`test-web` (`pnpm test`).

`.github/workflows/release.yml` runs on tag pushes matching `v*.*.*` (and
manually), but only when the tagged commit is an ancestor of `main`:
installs Node/pnpm/JDK 21/Android SDK, runs tests, builds the web bundle,
`cap sync android`, `gradlew assembleRelease`, then publishes a GitHub
Release with `substrack-<tag>.apk` attached.

App version resolution: the release workflow sets `VITE_APP_VERSION` (web)
and `VERSION_NAME`/`VERSION_CODE` (gradle) from the tag/run number. Local
builds fall back to `git describe --tags --always --dirty`
(vite.config.ts, android/app/build.gradle) and commit count for
versionCode, then package.json.

Release signing: `android/app/build.gradle` uses `signingConfigs.release`
when `android/keystore.properties` exists (gitignored; `storeFile` points
to `app/substrack-release.jks`, also gitignored — the only copy, keep a
backup) and falls back to the debug key otherwise. CI rebuilds both files
from secrets `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`,
`KEY_PASSWORD` and fails fast if any is missing. Debug builds get
`applicationIdSuffix ".dev"` → install as `substrack.app.dev` next to the
release `substrack.app`, never overwriting it.

## Self-update

`src/update.ts` checks `quonaro/SubsTrack` GitHub releases on start and
from Settings. On Android it downloads the release `.apk` asset via
`Filesystem.downloadFile` into the app cache (parent dir `updates/` must
be `mkdir`'d first — `recursive` is ignored on Android) and hands it to a
custom `ApkInstaller` plugin
(`android/app/src/main/java/substrack/app/ApkInstallerPlugin.java`) that
fires the package-installer intent through FileProvider and mirrors
progress into the notification shade. Requires
`REQUEST_INSTALL_PACKAGES` + the "install unknown apps" toggle granted
from system settings (`openInstallSettings`). Works only for sideloaded
distribution — not Play Store policy.

## Architecture

`src/db/` — storage. `index.ts` opens the `substrack` database through
`@capacitor-community/sqlite`: native on Android, `jeep-sqlite`
(sql.js → IndexedDB) on the web dev build. Every `Db` implementation
gets `PRAGMA foreign_keys = ON` — SQLite defaults it OFF and the
CASCADE/SET NULL clauses silently no-op without it. `schema.ts` holds
versioned migrations applied under `PRAGMA user_version` inside a
transaction.

Schema (see `schema.ts`): `categories`, `subscriptions` (money as
`price_minor` integer minor units, `period_days` flexible cycle, ISO
date strings), `payments`, `notify_rules` (advance/payment_day/recurring
per subscription), `events` (audit log), `settings` (key/value).

`src/domain/` — pure logic is split from DB access so it's testable:
- `dates.ts` — ISO-date math, `nextPaymentAfter`/`firstPaymentOnOrAfter`
  cycle rolling, `paymentDatesInRange` for the calendar
- `currency.ts` — static RUB-based rates (ported from the old backend),
  minor-unit convert/format/parse
- `subscriptions.ts`/`categories.ts`/`payments.ts`/`rules.ts`/`events.ts`/
  `settings.ts` — repositories that also write `events` audit rows
- `stats.ts` — pure aggregations over loaded rows (per-period cost
  normalization, category breakdown, monthly buckets)
- `reminders.ts` — `computeReminders` (pure) + `rescheduleAll`, which
  fully cancels and reschedules `LocalNotifications` on every mutation
  instead of bookkeeping deltas; notification ids are a deterministic
  hash of sub+rule+fireAt. `recurring` rules only get their next
  occurrence scheduled — the plugin has no per-hour repeat.

`src/store.ts` — reactive store holding all entities; every mutation
reloads affected slices and triggers `rescheduleAll`.

`src/router.ts` — vue-router; `afterEach` persists `fullPath` into
`substrack:nav` localStorage, `beforeEach` restores it once on boot and
falls back to the list when a `/subscriptions/:id/edit` target no longer
exists.

`src/components/` — Reka UI primitives (Dialog → `Sheet.vue` bottom
sheets, Switch → `ToggleSwitch.vue`) plus `OptionField` (field → option
sheet), `EmojiPicker`, `SubCard`, `Icon`.

`src/views/` — Home (totals + upcoming), Subscriptions (sort/archive),
SubscriptionForm (create/edit + rules editor + category manager),
Calendar (month grid via `paymentDatesInRange` + day sheet), History
(events feed), Stats (totals/breakdown/monthly), Settings (theme, base
currency, notification/install permissions, self-update).

## Capacitor

- `appId`: `substrack.app`, `webDir`: `dist` (see `capacitor.config.ts`)
- `CapacitorSQLite.androidIsEncryption: false` — the plugin's keystore
  init can brick on devices where keygen fails; we never open encrypted
  connections
- `AndroidManifest`: `allowBackup=false` + `hasFragileUserData="true"`
  (backup datasets break the "keep app data" reinstall path on some
  OEMs, verified on Honor/MagicOS); permissions: INTERNET,
  REQUEST_INSTALL_PACKAGES, POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM
- Frontend work is mobile-first: design for touch + small screens first

## Testing

Tests are required for behavior changes: `pnpm test`, `pnpm typecheck`
and `pnpm lint` must be green. `*.test.ts` live next to sources.
Anything testable through real SQL goes through `src/db/testdb.ts`
instead of mocks.

## File size

Keep Vue SFCs around 600 lines and below 700, domain modules around 300
and below 400. Split by responsibility before exceeding; count physical
lines. Generated files exempt.
