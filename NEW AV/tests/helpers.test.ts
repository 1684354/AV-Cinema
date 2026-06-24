import { describe, it, expect, beforeAll } from 'vitest'

describe('query helpers patterns', () => {
  let db: any

  beforeAll(async () => {
    const { getTestDb } = await import('./setup')
    db = await getTestDb()
  })

  it('can insert and query movies', () => {
    const stmt = db.prepare(`INSERT INTO movies (category, code, title) VALUES (?, ?, ?)`)
    stmt.bind(['AV', 'TEST-001', '测试影片 1'])
    stmt.step()
    stmt.free()

    const result = db.exec('SELECT * FROM movies WHERE code = ?', ['TEST-001'])
    expect(result[0].values[0]).toEqual([
      1, 'AV', 'TEST-001', '测试影片 1', '', '[]', '', '', 0, '', '[]',
      0, 0, 0, 0, 0, '', '[]', '', 0, '', expect.any(String), expect.any(String)
    ])
  })

  it('can filter movies by category', () => {
    const insert = db.prepare('INSERT INTO movies (category, code, title) VALUES (?, ?, ?)')
    insert.bind(['动漫', 'ANIME-001', '动漫测试'])
    insert.step()
    insert.bind(['AV', 'TEST-002', '测试影片 2'])
    insert.step()
    insert.free()

    const avMovies = db.exec('SELECT COUNT(*) FROM movies WHERE category = ?', ['AV'])
    expect(avMovies[0].values[0][0]).toBe(2)

    const animeMovies = db.exec('SELECT COUNT(*) FROM movies WHERE category = ?', ['动漫'])
    expect(animeMovies[0].values[0][0]).toBe(1)
  })

  it('can search movies by like pattern', () => {
    const movies = db.exec(
      'SELECT id, code, title FROM movies WHERE code LIKE ? OR title LIKE ?',
      ['%TEST%', '%TEST%']
    )
    expect(movies[0].values.length).toBe(2)
  })
})
