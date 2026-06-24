import { ipcMain } from 'electron'
import { q, qOne, qVal, qRun } from '../database/helpers'
import { persistDb } from '../database/index'

export function registerSettingsIpc(): void {
  ipcMain.handle('getSettings', () => {
    const rows = q('SELECT key, value FROM settings')
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    return settings
  })

  ipcMain.handle('updateSetting', (_event, key: string, value: string) => {
    qRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('getSetting', (_event, key: string) => {
    const result = qOne('SELECT value FROM settings WHERE key = ?', [key])
    return result?.value || ''
  })
}
