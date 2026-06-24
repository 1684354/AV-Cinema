import { describe, it, expect, beforeAll } from 'vitest'

describe('movie queries (IPC SQL patterns)', () => {
  let db: any

  beforeAll(async () => {
    const { getTestDb } = await import('./setup')
    db = await getTestDb()

    // Seed movie data
    const movies = [
      { category: 'AV', code: 'AV-001', title: 'AAA', has_subtitle: 1, is_favorite: 1, release_date: '2024-01-01' },
      { category: 'AV', code: 'AV-002', title: 'BBB', is_uncensored: 1, release_date: '2024-06-15' },
      { category: '动漫', code: 'ANIME-001', title: 'CCC', has_chinese: 1, release_date: '2024-03-20' },
      { category: '欧美', code: 'EU-001', title: 'DDD', release_date: '2024-09-01' },
      { category: 'AV', code: 'AV-003', title: 'EEE', has_subtitle: 1, is_uncensored: 1, release_date: '2024-12-01' },
    ]

    for (const m of movies) {
      const stmt = db.prepare(
        'INSERT INTO movies (category, code, title, has_subtitle, is_uncensored, has_chinese, is_favorite, release_date) VALUES (?,?,?,?,?,?,?,?)'
      )
      stmt.bind([m.category, m.code, m.title, m.has_subtitle || 0, m.is_uncensored || 0, m.has_chinese || 0, m.is_favorite || 0, m.release_date])
      stmt.step()
      stmt.free()
    }
  })

  it('getMovies with category=AV returns only AV movies', () => {
    const results = db.exec('SELECT * FROM movies WHERE category = ? ORDER BY id', ['AV'])
    expect(results[0].values.length).toBe(3)
  })

  it('getMovies sorted by release_date DESC', () => {
    const results = db.exec('SELECT code, release_date FROM movies ORDER BY release_date DESC')
    const codes = results[0].values.map((r: any) => r[0])
    expect(codes[0]).toBe('AV-003')
    expect(codes[4]).toBe('AV-001')
  })

  it('getMovies with subtitle filter', () => {
    const results = db.exec('SELECT COUNT(*) FROM movies WHERE has_subtitle = 1')
    expect(results[0].values[0][0]).toBe(2)
  })

  it('getMovies with multiple filters (intersection)', () => {
    const results = db.exec('SELECT COUNT(*) FROM movies WHERE has_subtitle = 1 AND is_uncensored = 1')
    expect(results[0].values[0][0]).toBe(1)
  })

  it('getMovies with isFavorite=true', () => {
    const results = db.exec('SELECT COUNT(*) FROM movies WHERE is_favorite = 1')
    expect(results[0].values[0][0]).toBe(1)
  })

  it('getMovies with LIMIT/OFFSET pagination', () => {
    const results = db.exec('SELECT code FROM movies ORDER BY id LIMIT ? OFFSET ?', [2, 2])
    expect(results[0].values.length).toBe(2)
    expect(results[0].values[0][0]).toBe('ANIME-001')
    expect(results[0].values[1][0]).toBe('EU-001')
  })

  it('searchAll queries movies by code/title/actresses', () => {
    const results = db.exec("SELECT id, code FROM movies WHERE code LIKE ? OR title LIKE ?", ['%AV%', '%AV%'])
    expect(results[0].values.length).toBe(3)
  })
})
