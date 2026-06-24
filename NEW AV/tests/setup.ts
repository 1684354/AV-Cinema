import initSqlJs from 'sql.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let SQL: any

export async function getTestDb() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => path.join(__dirname, '../node_modules/sql.js/dist/', file)
    })
  }
  const db = new SQL.Database()
  // Run all CREATE TABLE statements
  db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT 'AV',
      code TEXT,
      title TEXT DEFAULT '',
      title_cn TEXT DEFAULT '',
      actress_ids TEXT DEFAULT '[]',
      actresses TEXT DEFAULT '',
      release_date TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      series TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      has_subtitle INTEGER DEFAULT 0,
      is_uncensored INTEGER DEFAULT 0,
      has_chinese INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      cover_path TEXT DEFAULT '',
      screenshot_paths TEXT DEFAULT '[]',
      video_path TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      source TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
    CREATE INDEX IF NOT EXISTS idx_movies_code ON movies(code);
    CREATE TABLE IF NOT EXISTS actresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_cn TEXT DEFAULT '',
      category TEXT DEFAULT 'AV',
      birthday TEXT DEFAULT '',
      height INTEGER DEFAULT 0,
      cup TEXT DEFAULT '',
      is_favorite INTEGER DEFAULT 0,
      avatar_path TEXT DEFAULT '',
      movie_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tag_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS websites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT DEFAULT '',
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
  return db
}
