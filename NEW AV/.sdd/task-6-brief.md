# Task 6: IPC 处理器 + preload API

**Files to create:**
- `electron/ipc/movieIpc.ts`
- `electron/ipc/actressIpc.ts`
- `electron/ipc/tagIpc.ts`
- `electron/ipc/websiteIpc.ts`
- `electron/ipc/settingsIpc.ts`
- `electron/ipc/searchIpc.ts`

**Files to modify:**
- `electron/preload.ts` — full rewrite with all APIs
- `electron/main.ts` — register all IPC handlers

## Context

Helper functions in `electron/database/helpers.ts`:
```typescript
q(sql, params?) → any[]         // SELECT, returns all rows
qOne(sql, params?) → any|null   // SELECT, returns first row
qVal(sql, params?) → any        // SELECT, returns first column of first row
qRun(sql, params?) → {changes}  // INSERT/UPDATE/DELETE
```

All IPC handlers use these helpers — no direct DB access.

## IPC handlers

### movieIpc.ts

```typescript
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
```

### actressIpc.ts

```typescript
import { ipcMain } from 'electron'
import { q, qOne, qVal, qRun } from '../database/helpers'
import { persistDb } from '../database/index'

export function registerActressIpc(): void {
  ipcMain.handle('getActresses', (_event, params) => {
    // params: { category?, sort?, page?, pageSize?, search? }
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.category && params.category !== 'all') {
      conditions.push('category = ?')
      queryParams.push(params.category)
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
    persistDb()
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
      persistDb()
      return !!newVal
    }
    return false
  })
}
```

### tagIpc.ts

```typescript
import { ipcMain } from 'electron'
import { q, qOne, qVal, qRun } from '../database/helpers'
import { persistDb } from '../database/index'

export function registerTagIpc(): void {
  ipcMain.handle('getTagCategories', () => {
    return q('SELECT * FROM tag_categories ORDER BY sort')
  })

  ipcMain.handle('getTagsByCategory', (_event, categoryId?: number) => {
    if (categoryId) {
      return q('SELECT * FROM tags WHERE category_id = ? ORDER BY sort', [categoryId])
    }
    const categories = q('SELECT * FROM tag_categories ORDER BY sort')
    return categories.map((cat: any) => ({
      ...cat,
      tags: q('SELECT * FROM tags WHERE category_id = ? ORDER BY sort', [cat.id])
    }))
  })

  ipcMain.handle('createTagCategory', (_event, data: { name: string }) => {
    const maxSort = qVal('SELECT COALESCE(MAX(sort), 0) as s FROM tag_categories') || 0
    qRun('INSERT INTO tag_categories (name, sort) VALUES (?, ?)', [data.name, maxSort + 1])
    persistDb()
    return qOne('SELECT * FROM tag_categories WHERE id = last_insert_rowid()')
  })

  ipcMain.handle('deleteTagCategory', (_event, id: number) => {
    qRun('DELETE FROM tags WHERE category_id = ?', [id])
    qRun('DELETE FROM tag_categories WHERE id = ?', [id])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('createTag', (_event, data: { name: string; categoryId: number }) => {
    const maxSort = qVal('SELECT COALESCE(MAX(sort), 0) as s FROM tags WHERE category_id = ?', [data.categoryId]) || 0
    qRun('INSERT INTO tags (name, category_id, sort) VALUES (?, ?, ?)', [data.name, data.categoryId, maxSort + 1])
    persistDb()
    return qOne('SELECT * FROM tags WHERE id = last_insert_rowid()')
  })

  ipcMain.handle('deleteTag', (_event, id: number) => {
    qRun('DELETE FROM tags WHERE id = ?', [id])
    persistDb()
    return { success: true }
  })

  ipcMain.handle('updateTagCategorySort', (_event, categories: { id: number; sort: number }[]) => {
    for (const cat of categories) {
      qRun('UPDATE tag_categories SET sort = ? WHERE id = ?', [cat.sort, cat.id])
    }
    persistDb()
    return { success: true }
  })
}
```

### websiteIpc.ts

```typescript
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
    if (url) shell.openExternal(url)
    return { success: true }
  })
}
```

### settingsIpc.ts

```typescript
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
```

### searchIpc.ts

```typescript
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
```

## preload.ts (full)

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // 影片
  getMovies: (params: any) => ipcRenderer.invoke('getMovies', params),
  getMovie: (id: number) => ipcRenderer.invoke('getMovie', id),
  createMovie: (data: any) => ipcRenderer.invoke('createMovie', data),
  updateMovie: (id: number, data: any) => ipcRenderer.invoke('updateMovie', id, data),
  deleteMovie: (id: number) => ipcRenderer.invoke('deleteMovie', id),
  getMovieCount: () => ipcRenderer.invoke('getMovieCount'),
  playMovie: (videoPath: string) => ipcRenderer.invoke('playMovie', videoPath),
  openFileLocation: (videoPath: string) => ipcRenderer.invoke('openFileLocation', videoPath),
  toggleMovieFavorite: (id: number) => ipcRenderer.invoke('toggleMovieFavorite', id),

  // 女优
  getActresses: (params: any) => ipcRenderer.invoke('getActresses', params),
  getActress: (id: number) => ipcRenderer.invoke('getActress', id),
  updateActress: (id: number, data: any) => ipcRenderer.invoke('updateActress', id, data),
  getActressMovies: (actressId: number) => ipcRenderer.invoke('getActressMovies', actressId),
  toggleActressFavorite: (id: number) => ipcRenderer.invoke('toggleActressFavorite', id),

  // 标签
  getTagCategories: () => ipcRenderer.invoke('getTagCategories'),
  getTagsByCategory: (categoryId?: number) => ipcRenderer.invoke('getTagsByCategory', categoryId),
  createTagCategory: (data: { name: string }) => ipcRenderer.invoke('createTagCategory', data),
  deleteTagCategory: (id: number) => ipcRenderer.invoke('deleteTagCategory', id),
  createTag: (data: { name: string; categoryId: number }) => ipcRenderer.invoke('createTag', data),
  deleteTag: (id: number) => ipcRenderer.invoke('deleteTag', id),
  updateTagCategorySort: (categories: { id: number; sort: number }[]) => ipcRenderer.invoke('updateTagCategorySort', categories),

  // 网站
  getWebsites: () => ipcRenderer.invoke('getWebsites'),
  createWebsite: (data: any) => ipcRenderer.invoke('createWebsite', data),
  updateWebsite: (id: number, data: any) => ipcRenderer.invoke('updateWebsite', id, data),
  deleteWebsite: (id: number) => ipcRenderer.invoke('deleteWebsite', id),
  openWebsite: (url: string) => ipcRenderer.invoke('openWebsite', url),

  // 设置
  getSettings: () => ipcRenderer.invoke('getSettings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('updateSetting', key, value),
  getSetting: (key: string) => ipcRenderer.invoke('getSetting', key),

  // 搜索
  searchAll: (query: string) => ipcRenderer.invoke('searchAll', query),

  // 通用（旧的ping保留）
  ping: () => ipcRenderer.invoke('ping'),
}

contextBridge.exposeInMainWorld('api', api)
```

## main.ts changes

In `app.whenReady()`, after `initDatabase()` and migration, add:

```typescript
import { registerMovieIpc } from './ipc/movieIpc'
import { registerActressIpc } from './ipc/actressIpc'
import { registerTagIpc } from './ipc/tagIpc'
import { registerWebsiteIpc } from './ipc/websiteIpc'
import { registerSettingsIpc } from './ipc/settingsIpc'
import { registerSearchIpc } from './ipc/searchIpc'

// Inside app.whenReady(), after migration:
registerMovieIpc()
registerActressIpc()
registerTagIpc()
registerWebsiteIpc()
registerSettingsIpc()
registerSearchIpc()
```

## Verify

Build: `npx vite build`

## Working directory

`/c/Users/Administrator/Desktop/CLADUE/NEW AV`
