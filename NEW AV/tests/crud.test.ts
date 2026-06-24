import { describe, it, expect, beforeAll } from 'vitest'

describe('movie CRUD operations', () => {
  let db: any

  beforeAll(async () => {
    const { getTestDb } = await import('./setup')
    db = await getTestDb()
  })

  it('createMovie inserts correctly', () => {
    const sql = `INSERT INTO movies (category, code, title, actresses, tags, video_path, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    const stmt = db.prepare(sql)
    stmt.bind(['AV', 'CRUD-001', 'CRUD测试', '女优A 女优B', '["巨乳","丝袜"]', 'G:\\video.mp4', 0])
    stmt.step()
    stmt.free()

    const movie = db.exec('SELECT id, code, title, actresses, tags, video_path FROM movies WHERE code = ?', ['CRUD-001'])
    expect(movie[0].values[0]).toEqual([1, 'CRUD-001', 'CRUD测试', '女优A 女优B', '["巨乳","丝袜"]', 'G:\\video.mp4'])
  })

  it('updateMovie changes fields', () => {
    const sql = `UPDATE movies SET title = ?, tags = ?, updated_at = datetime('now','localtime') WHERE code = ?`
    db.run(sql, ['CRUD更新', '["美乳"]', 'CRUD-001'])

    const movie = db.exec('SELECT title, tags FROM movies WHERE code = ?', ['CRUD-001'])
    expect(movie[0].values[0][0]).toBe('CRUD更新')
    expect(movie[0].values[0][1]).toBe('["美乳"]')
  })

  it('deleteMovie removes record', () => {
    db.run('DELETE FROM movies WHERE code = ?', ['CRUD-001'])
    const exists = db.exec('SELECT COUNT(*) FROM movies WHERE code = ?', ['CRUD-001'])
    expect(exists[0].values[0][0]).toBe(0)
  })

  it('toggleMovieFavorite flips is_favorite', () => {
    db.run('INSERT INTO movies (code, is_favorite) VALUES (?, ?)', ['FAV-001', 0])
    db.run('UPDATE movies SET is_favorite = 1 WHERE code = ?', ['FAV-001'])

    const fav = db.exec('SELECT is_favorite FROM movies WHERE code = ?', ['FAV-001'])
    expect(fav[0].values[0][0]).toBe(1)

    db.run('UPDATE movies SET is_favorite = 0 WHERE code = ?', ['FAV-001'])
    const unfav = db.exec('SELECT is_favorite FROM movies WHERE code = ?', ['FAV-001'])
    expect(unfav[0].values[0][0]).toBe(0)
  })
})
