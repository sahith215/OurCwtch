import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'ourcwtch.db')

const client = createClient({
  url: `file:${dbPath}`,
})

// Auto-migration helper for missing tables and columns
async function initSchema() {
  const migrations = [
    // Create missing tables if any
    `CREATE TABLE IF NOT EXISTS shared_meta (key TEXT PRIMARY KEY, value TEXT);`,
    `CREATE TABLE IF NOT EXISTS profile_extras (role TEXT PRIMARY KEY, tagline TEXT, fav_song TEXT, comfort_food TEXT, love_language TEXT, quirk TEXT, obsession TEXT, photo_url TEXT);`,
    `CREATE TABLE IF NOT EXISTS meets (id TEXT PRIMARY KEY, title TEXT NOT NULL, note TEXT NOT NULL, photo_url TEXT NOT NULL, date TEXT NOT NULL, time_of_day TEXT NOT NULL, "order" INTEGER NOT NULL, is_upcoming INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS memory_cards (id TEXT PRIMARY KEY, reason_number INTEGER NOT NULL, title TEXT NOT NULL, subtitle TEXT, note TEXT NOT NULL, photo_url TEXT NOT NULL, img_zoom REAL DEFAULT 1.0, img_x REAL DEFAULT 0, img_y REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS confessions (id TEXT PRIMARY KEY, author_role TEXT NOT NULL, body TEXT NOT NULL, tone_tag TEXT NOT NULL, reveal_at TEXT NOT NULL, opened_at TEXT, opened_by_role TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS private_love_lines (id TEXT PRIMARY KEY, author_role TEXT NOT NULL, target_role TEXT NOT NULL, line_text TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS this_or_that_answers (id TEXT PRIMARY KEY, role TEXT NOT NULL, question_key TEXT NOT NULL, answer TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS fun_facts (id TEXT PRIMARY KEY, body TEXT NOT NULL, "order" INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS playlist_meta (id INTEGER PRIMARY KEY DEFAULT 1, spotify_url TEXT, subtitle TEXT, track_count INTEGER DEFAULT 38, total_duration TEXT DEFAULT '2h 14m');`,
    `CREATE TABLE IF NOT EXISTS home_hero (id INTEGER PRIMARY KEY DEFAULT 1, image_url TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS birthday_wishes (id TEXT PRIMARY KEY, author_role TEXT NOT NULL, text TEXT NOT NULL, year INTEGER NOT NULL, shown_to_partner INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    // Safe column additions for meets
    `ALTER TABLE meets ADD COLUMN location TEXT;`,
    `ALTER TABLE meets ADD COLUMN best_memory TEXT;`,
    `ALTER TABLE meets ADD COLUMN soundtrack TEXT;`,
    `ALTER TABLE meets ADD COLUMN mood_tag TEXT;`,
  ]

  for (const sqlQuery of migrations) {
    try {
      await client.execute(sqlQuery)
    } catch {
      // Ignore if table/column already exists
    }
  }
}

initSchema().catch(() => {})

export const db = drizzle(client, { schema })
