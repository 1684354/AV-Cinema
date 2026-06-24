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
