import { ipcMain, shell } from 'electron'
import { q, qOne, qRun } from '../database/helpers'
import { persistDb } from '../database/index'

export function registerWebsiteIpc(): void {
  ipcMain.handle('getWebsites', () => {
    return q('SELECT * FROM websites ORDER BY sort')
  })

  ipcMain.handle('createWebsite', (_event, data) => {
    const maxSort = q('SELECT COALESCE(MAX(sort), 0) as s FROM websites')
    const sort = (maxSort[0]?.s || 0) + 1
    qRun('INSERT INTO websites (category, name, url, description, sort) VALUES (?,?,?,?,?)',
      [data.category || '', data.name, data.url, data.description || '', sort])
    persistDb()
    return qOne('SELECT * FROM websites WHERE id = last_insert_rowid()')
  })

  ipcMain.handle('updateWebsite', (_event, id: number, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = Object.values(data)
    qRun(`UPDATE websites SET ${fields} WHERE id = ?`, [...values, id])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('deleteWebsite', (_event, id: number) => {
    qRun('DELETE FROM websites WHERE id = ?', [id])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('openWebsite', (_event, url: string) => {
    if (!url) return { success: false, error: 'No URL provided' }
    try {
      shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
