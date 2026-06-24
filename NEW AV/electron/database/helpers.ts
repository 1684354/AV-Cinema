import { getDb } from './index'

// Query all rows as objects
export function q(sql: string, params?: any): any[] {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) results.push(stmt.getAsObject())
    stmt.free()
    return results
  } catch (err) {
    console.error('sql.js query error:', err)
    return []
  }
}

// Query single row as object
export function qOne(sql: string, params?: any): any | null {
  const results = q(sql, params)
  return results.length > 0 ? results[0] : null
}

// Query single value
export function qVal(sql: string, params?: any): any {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params)
    let val = null
    if (stmt.step()) {
      const row = stmt.get()
      stmt.free()
      return row[0]
    }
    stmt.free()
    return null
  } catch (err) {
    console.error('sql.js query error:', err)
    return null
  }
}

// Run a write query
export function qRun(sql: string, params?: any): any {
  const db = getDb()
  try {
    db.run(sql, params)
    return { changes: db.getRowsModified() }
  } catch (err) {
    console.error('sql.js run error:', err)
    return { changes: 0 }
  }
}
