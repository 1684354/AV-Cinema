# Task 5: 旧数据迁移

**Files to create:**
- `electron/database/migrations/001_import_legacy.ts`

**Modify:**
- `electron/main.ts` — call `runLegacyMigration()` after `initDatabase()`

## Context

This reads from the old database at `G:\aiqiyi\DataBase\META-INF\data.dll` (which is a SQLite database using sql.js format) and imports data into our new `AV_CINEMA.db`.

Helper functions already exist at `electron/database/helpers.ts`:
- `q(sql, params)` → all rows as objects
- `qOne(sql, params)` → single row
- `qVal(sql, params)` → single value  
- `qRun(sql, params)` → write query

Legacy DB path: `G:\aiqiyi\DataBase\META-INF\data.dll`
Legacy SET path: `G:\aiqiyi\DataBase\META-INF\set.dll`
App root: `G:\aiqiyi\DataBase`

## Legacy table structures

**movies** table (data.dll):
```
id, fl (分类), ph (番号), pm (片名), yid (女优ID), yy (女优名),
fxrq (发行日期), zz (字幕=y/n), lc (无码=y/n), pj (破解=y/n),
dt (中字=y/n), sc (时长), dy (视频路径|格式), jt (截图路径|分隔),
bq (标签，逗号分隔), xl (系列), tjrq (时间戳ms), playCount
```

**femas** table (data.dll) — actresses:
```
id, fl (分类), mz (名字), bm (中文名), tx (头像路径),
cs (生日), sg (身高), xw (胸围), yw (腰围), tw (臀围),
zb (罩杯), cd (出道日期), tjrq (时间戳ms), tix (胸型=2人工/5天然), bz (备注)
```

**website** table (data.dll):
```
id, fl (分类), lg (图标路径), zm (名称), wz (URL), ms (描述)
```

**tagclas** table (data.dll):
```
id, zt (主题), js (技术), fz (服饰), tx (体型), xw (行为), wf (玩法), qt (其他), z1 (场景)
Row content: tags separated by Chinese comma "，"
```

**likes** table (data.dll):
```
id, yid (女优ID), ph (movie的tjrq时间戳), mz, dy, ps, xl, tjrq
```

**setting** table (set.dll):
```
id, web (网站URL列表用|分隔), ...
```

## Migration logic

1. Open legacy `data.dll` using sql.js: `const legacy = new SQL.Database(fs.readFileSync(path))`
2. Check `migration_log` table — skip if already migrated
3. Migrate movies: map each field, handle categories (有码/无码→AV, 其他→动漫), parse tags from comma-separated to JSON array, extract video_path from `dy` field (format: `"title|path|hasCover"`)
4. Migrate actresses: map fields, handle avatar_path (replace `[appUrl]` with `G:\aiqiyi\DataBase`), tix=2→"人工", tix=5→"天然", bz包含"熟"→is_mature=1
5. Migrate websites: map fields, replace `[appUrl]` in icon path
6. Migrate tags: each column in tagclas row becomes a category, its comma-separated values become tags
7. Migrate likes: find movie by created_at timestamp, set is_favorite=1
8. Migrate settings from set.dll
9. Write migration_log entry
10. Close legacy DBs

**Important:** Use the helper functions from `electron/database/helpers.ts` for writing to the new database. For reading from legacy, use raw sql.js since it's a different DB instance:
```typescript
import initSqlJs from 'sql.js'
const SQL = await initSqlJs({ locateFile: (f) => path.join(__dirname, '../../../node_modules/sql.js/dist/', f) })
const legacyDb = new SQL.Database(fs.readFileSync(legacyPath))
const rows = legacyDb.exec(sql)  // or use prepare/step
```

## Update electron/main.ts

After `await initDatabase()`, add:
```typescript
const { runLegacyMigration } = require('./database/migrations/001_import_legacy')
const migrated = runLegacyMigration()
```

Note: Since the migration reads legacy files synchronously but sql.js init is async, wrap the call appropriately. Or since we already have SQL initialized in database/index.ts, we can export it.

**Better approach:** Export the `SQL` instance from `database/index.ts` and reuse it in the migration:

```typescript
// In database/index.ts, export getSQL()
export function getSQL() { return SQL }

// In migration:
import { getDb, getSQL } from '../index'
const SQL = getSQL()
const buffer = fs.readFileSync(legacyPath)
const legacyDb = new SQL.Database(buffer)
```

## Verify

Run `npx vite build` — should compile clean. Actual migration only runs at runtime when legacy data.dll exists.

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
