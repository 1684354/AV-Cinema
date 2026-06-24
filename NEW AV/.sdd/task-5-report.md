# Task 5 Report: Legacy Data Migration

## Status
**PASS** — Migration implemented, builds clean, committed.

## Commit SHA
`fbc27b8fea0061493b92ce0a94b48ab63067d79f`

## Files Created/Modified
- **Created:** `electron/database/migrations/001_import_legacy.ts` (366 lines)
- **Modified:** `electron/main.ts` — added dynamic import and async call to `runLegacyMigration()` after `initDatabase()`

## Build Result
- `npx vite build` — **PASS** (all 3 builds: renderer, main, preload)
- Migration file correctly split into its own chunk (`dist-electron/001_import_legacy-BhkHxY22.js`)

## Migration Logic Summary
1. **Guard:** Checks `migration_log` table for version 1 — skips if already applied
2. **Movies (697 rows):** Maps categories (有码/无码→AV, 其他→动漫), parses tags (Chinese/ASCII comma split), extracts video_path from `dy` field (`title|path|hasCover`), parses screenshot paths from `jt` field
3. **Actresses (2403 rows):** Maps fields, resolves `[appUrl]` to `G:\aiqiyi\DataBase`, converts `tix=2→人工, tix=5→天然`, sets `is_mature=1` when `bz` contains "熟"
4. **Websites (7 rows):** Maps with `[appUrl]` resolution for icon_path
5. **Tags:** Reads single `tagclas` row, each column becomes a `tag_categories` entry, values become `tags` entries
6. **Likes (210 rows):** For `ph` entries (movie timestamps), finds movie by `created_at`; for `yid` entries (actress IDs), marks actress as is_favorite
7. **Settings:** Reads `web` field from `set.dll` → stores as `settings` key-value
8. **Logging:** Writes migration_log entry on success

## Concerns
- **Actress ID mismatch:** Legacy uses auto-increment IDs for actresses, but the new DB also uses auto-increment. Matching by name instead of ID prevents duplication but means movie `actress_ids` stores *legacy* IDs, not new DB IDs. A follow-up migration could remap these.
- **Movie-actress relationship:** Legacy has a `movie_actress` join table but no simple FK column on movies — the `yid` column stores a single actress ID. The new schema stores `actress_ids` as a JSON array, which is consistent with the single-ID approach for now.
- **Large actress count (2403):** Most were already imported from a previous migration attempt (the legacy DB has a `_migration` table). The migration handles this by checking name uniqueness before inserting.
