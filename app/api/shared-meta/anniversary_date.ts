import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { sharedMeta } from '../../lib/schema'
import { eq } from 'drizzle-orm'

export const Route = createAPIFileRoute('/api/shared-meta/anniversary_date')({
  POST: async ({ request }) => {
    const { value } = await request.json()
    if (!value) return json({ error: 'Value required' }, { status: 400 })

    const existing = await db.query.sharedMeta.findFirst({
      where: eq(sharedMeta.key, 'anniversary_date'),
    })

    if (!existing) {
      await db.insert(sharedMeta).values({
        key: 'anniversary_date',
        value,
      })
      return json({ success: true })
    }

    if (existing.value !== value) {
      return json({ error: 'Anniversary date mismatch' }, { status: 400 })
    }

    return json({ success: true })
  },
})
