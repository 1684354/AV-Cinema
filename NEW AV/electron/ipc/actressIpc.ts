import { ipcMain } from 'electron'
import { q, qOne, qVal, qRun } from '../database/helpers'

export function registerActressIpc(): void {
  ipcMain.handle('getActresses', (_event, params) => {
    // params: { category?, sort?, page?, pageSize?, search? }
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.category && params.category !== 'all') {
      const normalized = params.category.charAt(0).toUpperCase() + params.category.slice(1).toLowerCase()
      conditions.push('category = ?')
      queryParams.push(normalized)
    }
    if (params.search) {
      conditions.push('(name LIKE ? OR name_cn LIKE ?)')
      const s = `%${params.search}%`
      queryParams.push(s, s)
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    let orderBy = 'ORDER BY movie_count DESC'
    if (params.sort === 'name') orderBy = 'ORDER BY name ASC'

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const total = qVal(`SELECT COUNT(*) as cnt FROM actresses ${where}`, queryParams) || 0
    const actresses = q(`SELECT * FROM actresses ${where} ${orderBy} LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
    return { actresses, total }
  })

  ipcMain.handle('getActress', (_event, id: number) => {
    return qOne('SELECT * FROM actresses WHERE id = ?', [id])
  })

  ipcMain.handle('updateActress', (_event, id: number, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = Object.values(data)
    qRun(`UPDATE actresses SET ${fields}, updated_at = datetime('now','localtime') WHERE id = ?`, [...values, id])
    return qOne('SELECT * FROM actresses WHERE id = ?', [id])
  })

  ipcMain.handle('getActressMovies', (_event, actressId: number) => {
    // Find movies referencing this actress by ID or name
    const actress = qOne('SELECT * FROM actresses WHERE id = ?', [actressId])
    if (!actress) return []
    return q("SELECT * FROM movies WHERE actress_ids LIKE ? OR actresses LIKE ?",
      [`%${actressId}%`, `%${actress.name}%`])
  })

  ipcMain.handle('toggleActressFavorite', (_event, id: number) => {
    const actress = qOne('SELECT id, is_favorite FROM actresses WHERE id = ?', [id])
    if (actress) {
      const newVal = actress.is_favorite ? 0 : 1
      qRun('UPDATE actresses SET is_favorite = ? WHERE id = ?', [newVal, id])
      return !!newVal
    }
    return false
  })
}
