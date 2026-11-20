# SubsTrack

Local-first subscription tracker: Vue 3 + TypeScript + Reka UI frontend,
wrapped with Capacitor 8.5 for Android. No backend — all data lives in
on-device SQLite and survives app updates. UI is in Russian.

## Commands

- `pnpm install` — install deps
- `pnpm dev` — Vite dev server on :7358. In dev the browser DB is a real
  file at `data/substrack.db` (gitignored): `src/db/index.ts#openDevFile`
  POSTs SQL to the `/__substrack-db` middleware in `vite.config.ts`, which
  runs it through sql.js — inspect/seed it with `sqlite3` while vite runs.
  If the endpoint is missing (`vite preview`, prod web build) it falls back
  to jeep-sqlite + IndexedDB; `scripts/copy-wasm.mjs` copies `sql-wasm.wasm`
  into `public/assets/` via the `predev`/`prebuild` hooks
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
versioned migrations tracked via `PRAGMA user_version` — no explicit
transaction (jeep-sqlite rejects nested ones), statements are
idempotent instead. See **Database** for the compatibility rules.

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
`substrack:nav` localStorage, `beforeEach` restores it once on boot. The
legacy `/subscriptions/new` and `/subscriptions/:id/edit` paths redirect
to the list — create/edit live in sheets, not routes.

`src/components/` — Reka UI primitives (Dialog → `Modal.vue` bottom
sheets, Switch → `ToggleSwitch.vue`) plus `OptionField` (field → option
modal), `EmojiPicker`, `SubCard`, `Icon`, `SubscriptionForm` (shared
create/edit form + rules editor + category manager — `subId` prop:
null → create, id → edit; emits `saved`/`deleted`),
`SubscriptionEditModal` (edit `Modal` wrapping `SubscriptionForm`;
`subId` null → closed, emits `close`/`deleted`), `PageSkeleton`
(animated
mosaic overlay shown in `App.vue` until `store.ready`; guillotine-cut
tiles reshuffle on a timer, stays up ≥500ms then fades out). Route
changes play a directional slide transition (`slide-fwd`/`slide-back`
in `style.css`, direction from `slideDirection`/`ROUTE_ORDER` in
`router.ts`) instead of the skeleton.

`src/views/` — Home (totals + upcoming), Subscriptions (sort/archive,
FAB opens `SubscriptionForm` in a `Modal` for create),
Calendar (month grid via `paymentDatesInRange` + day sheet), History
(events feed), Stats (totals/breakdown/monthly), Settings (theme, palette
presets, accent, base
currency, notification/install permissions, self-update).

## Database

The SQLite file is the only data store and it survives app updates
_and_ downgrades: a user can sideload an older APK over data written by
a newer build ("keep app data" reinstall on some OEMs), or point an old
dev build at a newer IndexedDB copy. `migrate()` only moves forward
(`while version < SCHEMA.length`), so a `user_version` above the
bundled schema is left untouched and old code keeps running against the
newer schema. Every schema/data change must preserve that:

- Only additive migrations: `CREATE TABLE`, `CREATE INDEX`,
  `ALTER TABLE ... ADD COLUMN`. Never `DROP`/`RENAME` a column or
  table, never retype one, never rebuild a table — released builds
  still read and write the old shape.
- New `NOT NULL` columns need a `DEFAULT`, otherwise INSERTs from an
  old build (which doesn't know the column) fail.
- New constraints (`CHECK`, `UNIQUE`, FK) must accept every value an
  old build can write — SQLite enforces them against old INSERTs too.
- Never repurpose a column for a new meaning — old builds read it
  literally. Add a new column instead.
- Enum-like values (`notify_rules.kind`, `events.type`, settings keys):
  only ship a new value if the previous released build ignores unknown
  values rather than misreads or crashes on them (`reminders.ts`
  if/else chain ignores unknown `kind`; repositories select explicit
  columns or tolerate extra ones via `SELECT *`). When in doubt, add a
  column/table instead of overloading an existing value.
- Never edit a shipped migration: devices already past that
  `user_version` won't re-run it and their schema diverges. Append a
  new `SCHEMA` entry instead.
- Keep statements idempotent (`IF NOT EXISTS`, version bump last) — a
  crashed migration is retried on next launch.

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

## UI

- All buttons must be the same height: 36px.
- Strive for contrast: interactive controls (buttons, inputs, option
  fields, segments) must stand out from the card they sit in — don't
  reuse `bg-app-card` inside a card, give them `bg-app-bg` with a visible
  border. Selected/active state is a solid accent fill (`bg-accent` +
  `text-accent-fg`), not a faint `bg-accent/20` tint; labels use
  `text-app-text`, not muted colours.

## Testing

Tests are required for behavior changes: `pnpm test`, `pnpm typecheck`
and `pnpm lint` must be green. `*.test.ts` live next to sources.
Anything testable through real SQL goes through `src/db/testdb.ts`
instead of mocks.

Aim to cover everything coverable — when you add or change code, ship
tests for it too: pure functions in `src/domain/` (unit), repositories
and migrations through `testdb.ts` (real SQLite, no mocks), store
computeds/mutations, router guards, and components/views via
`@vue/test-utils` (Reka sheets teleport to `document.body`, so query
there).

## File size

Keep Vue SFCs around 600 lines and below 700, domain modules around 300
and below 400. Split by responsibility before exceeding; count physical
lines. Generated files exempt.
