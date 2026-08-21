import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { privateLoveLines } from '../lib/schema'
import { eq, ne } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/private-love-lines')({
  GET: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'

    // Return lines authored by the partner (authorRole != currentRole)
    const list = await db.query.privateLoveLines.findMany({
      where: ne(privateLoveLines.authorRole, currentRole),
    })
    return json(list)
  },
  POST: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const targetRole = currentRole === 'Husband' ? 'Wife' : 'Husband'
    const { lineText } = await request.json()

    if (!lineText || !lineText.trim()) {
      return json({ error: 'Line text required' }, { status: 400 })
    }

    const newLine = {
      id: crypto.randomUUID(),
      authorRole: currentRole,
      targetRole,
      lineText: lineText.trim(),
    }

    await db.insert(privateLoveLines).values(newLine)
    return json(newLine)
  },
})
