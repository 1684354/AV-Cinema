import { ipcMain, shell } from 'electron'
import { q, qOne, qVal, qRun } from '../database/helpers'
import { persistDb } from '../database/index'

export function registerMovieIpc(): void {
  ipcMain.handle('getMovies', (_event, params) => {
    // params: { category?, sort?, filters?: {hasSubtitle?, isUncensored?, hasChinese?}, page?, pageSize?, search? }
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.category && params.category !== 'all') {
      conditions.push('category = ?')
      queryParams.push(params.category)
    }
    if (params.search) {
      conditions.push('(title LIKE ? OR code LIKE ? OR actresses LIKE ?)')
      const s = `%${params.search}%`
      queryParams.push(s, s, s)
    }
    if (params.filters) {
      if (params.filters.hasSubtitle) conditions.push('has_subtitle = 1')
      if (params.filters.isUncensored) conditions.push('is_uncensored = 1')
      if (params.filters.hasChinese) conditions.push('has_chinese = 1')
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    let orderBy = 'ORDER BY created_at DESC'
    if (params.sort === 'release_date') orderBy = 'ORDER BY release_date DESC'
    else if (params.sort === 'actress') orderBy = 'ORDER BY actresses ASC'
    else if (params.sort === 'play_count') orderBy = 'ORDER BY play_count DESC'
    else if (params.sort === 'random') orderBy = 'ORDER BY RANDOM()'

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const total = qVal(`SELECT COUNT(*) as cnt FROM movies ${where}`, queryParams) || 0
    const movies = q(`SELECT * FROM movies ${where} ${orderBy} LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
    return { movies, total }
  })

  ipcMain.handle('getMovie', (_event, id: number) => {
    return qOne('SELECT * FROM movies WHERE id = ?', [id])
  })

  ipcMain.handle('createMovie', (_event, data) => {
    qRun(`INSERT INTO movies (category, code, title, title_cn, actress_ids, actresses,
      release_date, duration, series, tags, has_subtitle, is_uncensored,
      has_chinese, cover_path, screenshot_paths, video_path, file_size, source)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      data.category, data.code, data.title, data.title_cn || '',
      data.actress_ids || '[]', data.actresses || '',
      data.release_date || '', data.duration || 0, data.series || '',
      data.tags || '[]', data.has_subtitle || 0, data.is_uncensored || 0,
      data.has_chinese || 0, data.cover_path || '', data.screenshot_paths || '[]',
      data.video_path || '', data.file_size || 0, data.source || 'manual'
    ])
    persistDb()
    // Return the newly created movie
    return qOne('SELECT * FROM movies WHERE id = last_insert_rowid()')
  })

  ipcMain.handle('updateMovie', (_event, id: number, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = Object.values(data)
    qRun(`UPDATE movies SET ${fields}, updated_at = datetime('now','localtime') WHERE id = ?`, [...values, id])
    persistDb()
    return qOne('SELECT * FROM movies WHERE id = ?', [id])
  })

  ipcMain.handle('deleteMovie', (_event, id: number) => {
    qRun('DELETE FROM movies WHERE id = ?', [id])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('getMovieCount', () => {
    return qVal('SELECT COUNT(*) as cnt FROM movies') || 0
  })

  ipcMain.handle('playMovie', (_event, videoPath: string) => {
    if (videoPath) shell.openPath(videoPath)
    return { success: true }
  })

  ipcMain.handle('openFileLocation', (_event, videoPath: string) => {
    if (videoPath) shell.showItemInFolder(videoPath)
    return { success: true }
  })

  ipcMain.handle('toggleMovieFavorite', (_event, id: number) => {
    const movie = qOne('SELECT id, is_favorite FROM movies WHERE id = ?', [id])
    if (movie) {
      const newVal = movie.is_favorite ? 0 : 1
      qRun('UPDATE movies SET is_favorite = ? WHERE id = ?', [newVal, id])
      persistDb()
      return !!newVal
    }
    return false
  })
}
