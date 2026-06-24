import { ipcMain } from 'electron'
import { q } from '../database/helpers'

export function registerSearchIpc(): void {
  ipcMain.handle('searchAll', (_event, query: string) => {
    const s = `%${query}%`
    const movies = q(
      'SELECT id, code, title, actresses, cover_path, release_date FROM movies WHERE code LIKE ? OR title LIKE ? OR actresses LIKE ? LIMIT 20',
      [s, s, s]
    )
    const actresses = q(
      'SELECT id, name, name_cn, avatar_path, movie_count FROM actresses WHERE name LIKE ? OR name_cn LIKE ? LIMIT 20',
      [s, s]
    )
    return { movies, actresses, query }
  })
}
