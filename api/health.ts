import type { VercelRequest, VercelResponse } from "@vercel/node"
import { db } from "../app/lib/db.js"
import { auth } from "../app/lib/auth.js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {}

  try {
    await (db as any).$client.execute("SELECT 1")
    results.db = "ok"
  } catch (e: any) {
    results.db = "FAILED: " + e.message
  }

  try {
    results.auth = auth ? "loaded" : "null"
  } catch (e: any) {
    results.auth = "FAILED: " + e.message
  }

  results.env_turso = process.env.TURSO_DATABASE_URL ? "set" : "missing"
  results.env_token = process.env.TURSO_AUTH_TOKEN ? "set" : "missing"

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200
  res.end(JSON.stringify(results, null, 2))
}
