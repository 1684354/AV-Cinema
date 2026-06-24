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
