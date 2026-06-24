import { describe, it, expect, beforeAll } from 'vitest'

describe('actress queries', () => {
  let db: any

  beforeAll(async () => {
    const { getTestDb } = await import('./setup')
    db = await getTestDb()

    const actresses = [
      { name: '三上悠亜', category: 'AV', height: 159, cup: 'F', movie_count: 38 },
      { name: '桃乃木かな', category: 'AV', height: 153, cup: 'C', movie_count: 29 },
      { name: 'Melody Marks', category: '欧美', height: 165, cup: 'D', movie_count: 45 },
    ]

    for (const a of actresses) {
      const stmt = db.prepare('INSERT INTO actresses (name, category, height, cup, movie_count) VALUES (?,?,?,?,?)')
      stmt.bind([a.name, a.category, a.height, a.cup, a.movie_count])
      stmt.step()
      stmt.free()
    }
  })

  it('getActresses sorted by movie_count DESC', () => {
    const results = db.exec('SELECT name, movie_count FROM actresses ORDER BY movie_count DESC')
    expect(results[0].values[0][0]).toBe('Melody Marks')
    expect(results[0].values[1][0]).toBe('三上悠亜')
    expect(results[0].values[2][0]).toBe('桃乃木かな')
  })

  it('getActresses filtered by category', () => {
    const results = db.exec('SELECT COUNT(*) FROM actresses WHERE category = ?', ['欧美'])
    expect(results[0].values[0][0]).toBe(1)
  })

  it('getActresses with name search', () => {
    const results = db.exec('SELECT name FROM actresses WHERE name LIKE ?', ['%桃%'])
    expect(results[0].values[0][0]).toBe('桃乃木かな')
  })
})
