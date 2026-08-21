import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { confessions } from '../lib/schema'
import { eq, ne, and, desc } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/confessions')({
  GET: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') || 'field'

    if (scope === 'field') {
      // Return confessions for the partner to receive (authorRole != currentRole)
      const list = await db.query.confessions.findMany({
        where: ne(confessions.authorRole, currentRole),
        orderBy: [desc(confessions.createdAt)],
      })
      return json(list)
    } else {
      // Sent confessions by author
      const list = await db.query.confessions.findMany({
        where: eq(confessions.authorRole, currentRole),
        orderBy: [desc(confessions.createdAt)],
      })
      return json(list)
    }
  },
  POST: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const body = await request.json()

    if (!body.body || !body.body.trim()) {
      return json({ error: 'Confession body required' }, { status: 400 })
    }

    const newConfession = {
      id: crypto.randomUUID(),
      authorRole: currentRole,
      body: body.body.trim(),
      toneTag: body.toneTag || 'sweet',
      revealAt: body.revealAt || new Date().toISOString(),
    }

    await db.insert(confessions).values(newConfession)

    return json(newConfession)
  },
})
