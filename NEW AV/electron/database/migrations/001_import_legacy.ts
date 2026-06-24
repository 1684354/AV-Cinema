import path from 'path'
import fs from 'fs'
import { getSQL } from '../index'
import { qRun, qOne, qVal, q } from '../helpers'

const LEGACY_DB_PATH = 'G:\\aiqiyi\\DataBase\\META-INF\\data.dll'
const LEGACY_SET_PATH = 'G:\\aiqiyi\\DataBase\\META-INF\\set.dll'
const APP_ROOT = 'G:\\aiqiyi\\DataBase'

const CATEGORY_MAP: Record<string, string> = {
  '有码': 'AV',
  '无码': 'AV',
  '其他': '动漫',
  'AV': 'AV',
  '动漫': '动漫',
  '欧美': '欧美',
  '国产': '国产',
}

const BREAST_TYPE_MAP: Record<string, string> = {
  '2': '人工',
  '5': '天然',
}

const TAGCLAS_CATEGORY_MAP: Record<string, string> = {
  zt: '主题',
  js: '技术',
  fz: '服饰',
  tx: '体型',
  xw: '行为',
  wf: '玩法',
  qt: '其他',
  z1: '场景',
}

/**
 * Parse comma-separated tags from legacy bq field.
 * Separators can be Chinese comma "，" or ASCII comma ",".
 */
function parseTags(bq: string | null): string[] {
  if (!bq || bq.trim() === '') return []
  const raw = bq.replace(/[，,]/g, ',').split(',').map((s) => s.trim()).filter((s) => s.length > 0)
  return [...new Set(raw)]
}

/**
 * Extract video path from legacy dy field.
 * Format: "title|videoPath|hasCover"
 */
function extractVideoPath(dy: string | null): string {
  if (!dy) return ''
  const parts = dy.split('|')
  return parts.length >= 2 ? parts[1] : ''
}

/**
 * Parse screenshot paths from legacy jt field.
 * Format: "path1|path2|path3|..."
 */
function parseScreenshotPaths(jt: string | null): string[] {
  if (!jt || jt.trim() === '') return []
  return jt.split('|').map((s) => s.trim()).filter((s) => s.length > 0)
}

/**
 * Parse duration from legacy sc field (string, represents seconds).
 */
function parseDuration(sc: string | null): number {
  if (!sc) return 0
  const n = parseInt(sc, 10)
  return isNaN(n) ? 0 : n
}

/**
 * Replace [appUrl] with the actual app root path.
 */
function resolveAppUrl(p: string | null): string {
  if (!p) return ''
  return p.replace(/\[appUrl\]/gi, APP_ROOT)
}

/**
 * Check if a legacy actress has already been imported by checking if their name exists in the new DB.
 */
function actressExists(name: string): boolean {
  const existing = qVal('SELECT id FROM actresses WHERE name = ?', [name])
  return existing !== null
}

/**
 * Main migration function.
 * Returns true if migration was performed, false if already migrated.
 */
export async function runLegacyMigration(): Promise<boolean> {
  // Check if migration already ran
  const migrationLog = qOne('SELECT version FROM migration_log WHERE version = 1')
  if (migrationLog) {
    console.log('[Migration] Version 1 already applied, skipping.')
    return false
  }

  const SQL = getSQL()

  // Open legacy data.dll
  if (!fs.existsSync(LEGACY_DB_PATH)) {
    console.warn('[Migration] Legacy database not found at', LEGACY_DB_PATH)
    return false
  }

  console.log('[Migration] Starting legacy data migration (version 1)...')
  const legacyBuf = fs.readFileSync(LEGACY_DB_PATH)
  const legacyDb = new SQL.Database(legacyBuf)

  try {
    // ================================================================
    // 1. Migrate movies
    // ================================================================
    console.log('[Migration] Migrating movies...')
    const movieStmt = legacyDb.prepare('SELECT * FROM movies')
    let movieCount = 0
    while (movieStmt.step()) {
      const row = movieStmt.getAsObject()

      const category = CATEGORY_MAP[row.fl] || 'AV'
      const tags = parseTags(row.bq)
      const videoPath = extractVideoPath(row.dy)
      const screenshotPaths = parseScreenshotPaths(row.jt)
      const duration = parseDuration(row.sc)
      const hasSubtitle = row.zz === 'y' ? 1 : 0
      const isUncensored = row.lc === 'y' ? 1 : 0
      const hasChinese = row.dt === 'y' ? 1 : 0
      const playCount = row.playCount != null ? parseInt(row.playCount as string, 10) : 0
      const created_at = row.tjrq ? new Date(parseInt(row.tjrq as string, 10)).toISOString().replace('T', ' ').replace('Z', '') : null

      qRun(
        `INSERT INTO movies (
          category, code, title, actress_ids, actresses, release_date,
          duration, series, tags, has_subtitle, is_uncensored, has_chinese,
          play_count, screenshot_paths, video_path, cover_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category,
          row.ph || null,
          row.pm || '',
          row.yid ? JSON.stringify([parseInt(row.yid as string, 10)]) : '[]',
          row.yy || '',
          row.fxrq || '',
          duration,
          row.xl || null,
          JSON.stringify(tags),
          hasSubtitle,
          isUncensored,
          hasChinese,
          playCount,
          JSON.stringify(screenshotPaths),
          videoPath,
          screenshotPaths.length > 0 ? screenshotPaths[0] : '',
          created_at,
          created_at,
        ]
      )
      movieCount++
    }
    movieStmt.free()
    console.log(`[Migration] Migrated ${movieCount} movies.`)

    // ================================================================
    // 2. Migrate actresses (femas)
    // ================================================================
    console.log('[Migration] Migrating actresses...')
    const actressStmt = legacyDb.prepare('SELECT * FROM femas')
    let actressCount = 0
    while (actressStmt.step()) {
      const row = actressStmt.getAsObject()

      if (actressExists(row.mz)) {
        // Update existing instead of skipping, in case fields changed
        actressCount++
        continue
      }

      const category = CATEGORY_MAP[row.fl] || 'AV'
      const breastType = row.tix ? (BREAST_TYPE_MAP[String(row.tix)] || '') : ''
      const isMature = row.bz && String(row.bz).includes('熟') ? 1 : 0
      const avatarPath = resolveAppUrl(row.tx)
      const height = row.sg ? parseInt(String(row.sg), 10) : 0
      const bust = row.xw ? parseInt(String(row.xw), 10) : 0
      const waist = row.yw ? parseInt(String(row.yw), 10) : 0
      const hips = row.tw ? parseInt(String(row.tw), 10) : 0

      qRun(
        `INSERT INTO actresses (
          name, name_cn, category, birthday, debut_date,
          height, bust, waist, hips, cup,
          breast_type, is_mature, avatar_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`,
        [
          row.mz || '',
          row.bm || '',
          category,
          row.cs || '',
          row.cd || '',
          height,
          bust,
          waist,
          hips,
          row.zb || '',
          breastType,
          isMature,
          avatarPath,
        ]
      )
      actressCount++
    }
    actressStmt.free()
    console.log(`[Migration] Migrated ${actressCount} actresses.`)

    // ================================================================
    // 3. Migrate websites
    // ================================================================
    console.log('[Migration] Migrating websites...')
    const websiteStmt = legacyDb.prepare('SELECT * FROM website')
    let websiteCount = 0
    while (websiteStmt.step()) {
      const row = websiteStmt.getAsObject()
      const iconPath = resolveAppUrl(row.lg)

      qRun(
        `INSERT INTO websites (category, name, url, description, icon_path)
         VALUES (?, ?, ?, ?, ?)`,
        [
          row.fl || '',
          row.zm || '',
          row.wz || '',
          row.ms || '',
          iconPath,
        ]
      )
      websiteCount++
    }
    websiteStmt.free()
    console.log(`[Migration] Migrated ${websiteCount} websites.`)

    // ================================================================
    // 4. Migrate tags from tagclas
    // ================================================================
    console.log('[Migration] Migrating tag categories and tags...')
    const tagclasStmt = legacyDb.prepare('SELECT * FROM tagclas')
    let tagCategoryCount = 0
    let tagCount = 0
    while (tagclasStmt.step()) {
      const row = tagclasStmt.getAsObject()
      for (const [col, colName] of Object.entries(TAGCLAS_CATEGORY_MAP)) {
        const raw = row[col]
        if (!raw || String(raw).trim() === '') continue

        // Parse tags - tagclas values use Chinese comma
        const tags = String(raw).split('，').map((s) => s.trim()).filter((s) => s.length > 0)
        if (tags.length === 0) continue

        // Insert category if not exists
        let catId = qVal('SELECT id FROM tag_categories WHERE name = ?', [colName])
        if (catId === null) {
          qRun('INSERT INTO tag_categories (name, sort) VALUES (?, ?)', [colName, tagCategoryCount])
          catId = qVal('SELECT id FROM tag_categories WHERE name = ?', [colName])
          tagCategoryCount++
        }

        // Insert each tag
        for (const tag of tags) {
          const existingTag = qVal('SELECT id FROM tags WHERE name = ? AND category_id = ?', [tag, catId])
          if (existingTag === null) {
            qRun('INSERT INTO tags (name, category_id, sort) VALUES (?, ?, ?)', [tag, catId, tagCount])
            tagCount++
          }
        }
      }
    }
    tagclasStmt.free()
    console.log(`[Migration] Migrated ${tagCategoryCount} tag categories, ${tagCount} tags.`)

    // ================================================================
    // 5. Migrate likes
    // ================================================================
    console.log('[Migration] Migrating likes...')
    const likesStmt = legacyDb.prepare('SELECT * FROM likes')
    let likeCount = 0
    while (likesStmt.step()) {
      const row = likesStmt.getAsObject()

      if (row.ph) {
        // ph stores the movie's tjrq timestamp — convert to datetime string with ms
        const ts = parseFloat(String(row.ph))
        if (!isNaN(ts) && ts > 0) {
          const d = new Date(ts)
          const ms = String(d.getMilliseconds()).padStart(3, '0')
          const dt = d.toISOString().replace('T', ' ').replace('Z', '').split('.')[0] + '.' + ms
          const movies = q('SELECT id FROM movies WHERE created_at = ?', [dt])
          for (const movie of movies) {
            qRun('UPDATE movies SET is_favorite = 1 WHERE id = ?', [movie.id])
            likeCount++
          }
        }
      } else if (row.yid) {
        // yid stores actress id — mark as favorite
        const actressId = parseInt(String(row.yid), 10)
        if (!isNaN(actressId)) {
          qRun('UPDATE actresses SET is_favorite = 1 WHERE id = ?', [actressId])
          likeCount++
        }
      }
    }
    likesStmt.free()
    console.log(`[Migration] Updated ${likeCount} likes (movies + actresses).`)

    // ================================================================
    // 6. Migrate settings from set.dll
    // ================================================================
    console.log('[Migration] Migrating settings...')
    if (fs.existsSync(LEGACY_SET_PATH)) {
      const setBuf = fs.readFileSync(LEGACY_SET_PATH)
      const setDb = new SQL.Database(setBuf)

      const settingStmt = setDb.prepare('SELECT * FROM setting')
      while (settingStmt.step()) {
        const row = settingStmt.getAsObject()
        if (row.web) {
          qRun(
            'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            ['websites', String(row.web)]
          )
        }
      }
      settingStmt.free()
      setDb.close()
      console.log('[Migration] Settings migrated.')
    } else {
      console.warn('[Migration] set.dll not found, skipping settings migration.')
    }

    // ================================================================
    // 7. Write migration log
    // ================================================================
    qRun(
      'INSERT INTO migration_log (version, desc, applied_at) VALUES (?, ?, datetime(\'now\',\'localtime\'))',
      [1, 'Initial import from legacy data.dll']
    )

    console.log('[Migration] Legacy data migration completed successfully.')
    return true
  } catch (err) {
    console.error('[Migration] Error during migration:', err)
    throw err
  } finally {
    legacyDb.close()
  }
}
