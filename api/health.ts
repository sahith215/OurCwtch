import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200
  res.end(JSON.stringify({ status: "ok", env: { hasTurso: !!process.env.TURSO_DATABASE_URL, hasToken: !!process.env.TURSO_AUTH_TOKEN } }))
}
