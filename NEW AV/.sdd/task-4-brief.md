# Task 4: 数据库初始化与 schema（sql.js 版本）

**Files to create:**
- `electron/database/schema.ts` — SQL 建表语句常量
- `electron/database/index.ts` — 数据库初始化、连接管理、持久化

## Context

We use **sql.js** (pure JS SQLite) instead of better-sqlite3. Key API differences:
- Init is async: `const SQL = await initSqlJs(); const db = new SQL.Database(buffer)`
- No auto-persist — must call `db.export()` + `fs.writeFileSync()` manually
- Query: `const stmt = db.prepare(sql); stmt.bind(params); while(stmt.step()) { stmt.getAsObject() }`
- No `.all()`, `.get()`, or `.run()` convenience methods — need explicit step/free
- Write: `db.run(sql, params)` — this DOES exist on the Database object

**Update electron/main.ts** — make `app.whenReady()` async, call `initDatabase()` before `createWindow()`, add `closeDatabase()` on quit.

## electron/database/schema.ts

```typescript
export const CREATE_MOVIES_TABLE = `
CREATE TABLE IF NOT EXISTS movies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category      TEXT NOT NULL,
  code          TEXT,
  title         TEXT DEFAULT '',
  title_cn      TEXT DEFAULT '',
  actress_ids   TEXT DEFAULT '[]',
  actresses     TEXT DEFAULT '',
  release_date  TEXT DEFAULT '',
  duration      INTEGER DEFAULT 0,
  series        TEXT DEFAULT '',
  tags          TEXT DEFAULT '[]',
  has_subtitle  INTEGER DEFAULT 0,
  is_uncensored INTEGER DEFAULT 0,
  has_chinese   INTEGER DEFAULT 0,
  play_count    INTEGER DEFAULT 0,
  cover_path    TEXT DEFAULT '',
  screenshot_paths TEXT DEFAULT '[]',
  video_path    TEXT DEFAULT '',
  file_size     INTEGER DEFAULT 0,
  source        TEXT DEFAULT '',
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
)
`

export const CREATE_MOVIES_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_code ON movies(code);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
`

export const CREATE_ACTRESSES_TABLE = `
CREATE TABLE IF NOT EXISTS actresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  name_cn       TEXT DEFAULT '',
  category      TEXT DEFAULT 'AV',
  birthday      TEXT DEFAULT '',
  debut_date    TEXT DEFAULT '',
  height        INTEGER DEFAULT 0,
  bust          INTEGER DEFAULT 0,
  waist         INTEGER DEFAULT 0,
  hips          INTEGER DEFAULT 0,
  cup           TEXT DEFAULT '',
  breast_type   TEXT DEFAULT '',
  is_mature     INTEGER DEFAULT 0,
  is_favorite   INTEGER DEFAULT 0,
  avatar_path   TEXT DEFAULT '',
  movie_count   INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
)
`

export const CREATE_ACTRESSES_INDEX = `
CREATE INDEX IF NOT EXISTS idx_actresses_name ON actresses(name)
`

export const CREATE_TAG_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS tag_categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0
)
`

export const CREATE_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category_id INTEGER REFERENCES tag_categories(id) ON DELETE CASCADE,
  sort        INTEGER DEFAULT 0
)
`

export const CREATE_WEBSITES_TABLE = `
CREATE TABLE IF NOT EXISTS websites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT DEFAULT '',
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_path   TEXT DEFAULT '',
  sort        INTEGER DEFAULT 0
)
`

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
)
`

export const CREATE_MIGRATION_LOG_TABLE = `
CREATE TABLE IF NOT EXISTS migration_log (
  version    INTEGER PRIMARY KEY,
  desc       TEXT,
  applied_at TEXT DEFAULT (datetime('now','localtime'))
)
`
```

## electron/database/index.ts

```typescript
import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'

const SQL_Promise = initSqlJs({
  locateFile: (file: string) => path.join(__dirname, '../../node_modules/sql.js/dist/', file)
})

let SQL: any = null
let db: any = null

const DEFAULT_DB_PATH = 'G:\\aiqiyi\\AV_CINEMA.db'

export function getDbPath(): string {
  return DEFAULT_DB_PATH
}

export function getDb(): any {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function getSQL(): any {
  if (!SQL) throw new Error('SQL.js not initialized.')
  return SQL
}

export async function initDatabase(dbPath?: string): Promise<void> {
  const targetPath = dbPath || getDbPath()
  const dir = path.dirname(targetPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  SQL = await SQL_Promise

  if (fs.existsSync(targetPath)) {
    const buffer = fs.readFileSync(targetPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')

  // 执行建表
  const { 
    CREATE_MOVIES_TABLE, CREATE_MOVIES_INDEXES,
    CREATE_ACTRESSES_TABLE, CREATE_ACTRESSES_INDEX,
    CREATE_TAG_CATEGORIES_TABLE, CREATE_TAGS_TABLE,
    CREATE_WEBSITES_TABLE, CREATE_SETTINGS_TABLE,
    CREATE_MIGRATION_LOG_TABLE 
  } = require('./schema')

  db.run(CREATE_MOVIES_TABLE)
  db.run(CREATE_MOVIES_INDEXES)
  db.run(CREATE_ACTRESSES_TABLE)
  db.run(CREATE_ACTRESSES_INDEX)
  db.run(CREATE_TAG_CATEGORIES_TABLE)
  db.run(CREATE_TAGS_TABLE)
  db.run(CREATE_WEBSITES_TABLE)
  db.run(CREATE_SETTINGS_TABLE)
  db.run(CREATE_MIGRATION_LOG_TABLE)

  console.log(`Database initialized at: ${targetPath}`)
}

export function persistDb(): void {
  if (!db) return
  const targetPath = getDbPath()
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(targetPath, buffer)
}

export function closeDatabase(): void {
  if (db) {
    persistDb()
    db.close()
    db = null
  }
}
```

## Update electron/main.ts

Make `app.whenReady()` async, add database init:

```typescript
import { initDatabase, closeDatabase } from './database/index'

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  closeDatabase()
})
```

Keep the rest of main.ts the same as Task 2.

## Helper functions for sql.js queries (used by all IPC handlers)

Create `electron/database/helpers.ts`:

```typescript
import { getDb } from './index'

// Query all rows as objects
export function q(sql: string, params?: any): any[] {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    return results
  } catch (err) {
    console.error('sql.js query error:', err)
    return []
  }
}

// Query single row as object
export function qOne(sql: string, params?: any): any | null {
  const results = q(sql, params)
  return results.length > 0 ? results[0] : null
}

// Query single value
export function qVal(sql: string, params?: any): any {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params)
    let val = null
    if (stmt.step()) {
      const row = stmt.get()
      stmt.free()
      return row[0]
    }
    stmt.free()
    return null
  } catch (err) {
    console.error('sql.js query error:', err)
    return null
  }
}

// Run a write query
export function qRun(sql: string, params?: any): any {
  const db = getDb()
  try {
    db.run(sql, params)
    return { changes: db.getRowsModified() }
  } catch (err) {
    console.error('sql.js run error:', err)
    return { changes: 0 }
  }
}
```

## Working directory

Project at `/c/Users/Administrator/Desktop/CLADUE/NEW AV`. Git root at `/c/Users/Administrator/Desktop/CLADUE`.
