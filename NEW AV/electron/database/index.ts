import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'

import {
  CREATE_MOVIES_TABLE,
  CREATE_MOVIES_INDEXES,
  CREATE_ACTRESSES_TABLE,
  CREATE_ACTRESSES_INDEX,
  CREATE_TAG_CATEGORIES_TABLE,
  CREATE_TAGS_TABLE,
  CREATE_WEBSITES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_MIGRATION_LOG_TABLE
} from './schema'

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
