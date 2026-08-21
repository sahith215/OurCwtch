import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { confessions } from '../../lib/schema'
import { eq } from 'drizzle-orm'
import { requireOnboarded } from '../../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/confessions/$id/open')({
  PATCH: async ({ request, params }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const id = params.id

    const confession = await db.query.confessions.findFirst({
      where: eq(confessions.id, id),
    })

    if (!confession) {
      return json({ error: 'Confession not found' }, { status: 404 })
    }

    if (confession.authorRole === currentRole) {
      return json({ error: 'Forbidden: Cannot open own confession' }, { status: 403 })
    }

    if (!confession.openedAt) {
      await db.update(confessions)
        .set({
          openedAt: new Date().toISOString(),
          openedByRole: currentRole,
        })
        .where(eq(confessions.id, id))
    }

    return json({ success: true })
  },
})
