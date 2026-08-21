import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { sharedMeta } from '../../lib/schema'
import { requireSession } from '../../lib/authMiddleware'
import { eq } from 'drizzle-orm'

export const Route = createAPIFileRoute('/api/shared-meta/nickname')({
  POST: async ({ request }) => {
    const session = await requireSession(request)
    const { value } = await request.json()
    if (!value) return json({ error: 'Value required' }, { status: 400 })

    // If session user is Wife, she writes husband_nickname; if Husband, he writes wife_nickname
    const key = session.user.role === 'Wife' ? 'husband_nickname' : 'wife_nickname'

    const existing = await db.query.sharedMeta.findFirst({
      where: eq(sharedMeta.key, key),
    })

    if (existing) {
      await db.update(sharedMeta).set({ value }).where(eq(sharedMeta.key, key))
    } else {
      await db.insert(sharedMeta).values({ key, value })
    }

    return json({ success: true })
  },
})
