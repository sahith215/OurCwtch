import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {}

  try {
    const { db } = await import("../app/lib/db.js")
    results.db_import = "ok"
    try {
      const r = await (db as any).$client.execute("SELECT 1")
      results.db_query = "ok"
    } catch (e: any) {
      results.db_query = "FAILED: " + e.message
    }
  } catch (e: any) {
    results.db_import = "FAILED: " + e.message
  }

  try {
    const { auth } = await import("../app/lib/auth.js")
    results.auth_import = "ok"
  } catch (e: any) {
    results.auth_import = "FAILED: " + e.message
  }

  try {
    const { handleApiRequest } = await import("../app/lib/apiRouter.js")
    results.router_import = "ok"
  } catch (e: any) {
    results.router_import = "FAILED: " + e.message
  }

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200
  res.end(JSON.stringify(results, null, 2))
}
