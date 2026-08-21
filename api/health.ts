import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result: Record<string, string> = {}

  try {
    const { createClient } = await import("@libsql/client/web")
    const client = createClient({
      url: "https://ourcwtch-db-sahith215.aws-ap-south-1.turso.io",
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    })
    await client.execute("SELECT 1")
    result.db = "ok"
  } catch (e: any) {
    result.db = "FAILED: " + e.message
  }

  try {
    const { auth } = await import("../app/lib/auth.js")
    result.auth = "module loaded"
  } catch (e: any) {
    result.auth = "FAILED: " + e.message
  }

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200
  res.end(JSON.stringify(result))
}
