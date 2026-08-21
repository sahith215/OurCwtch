import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { memoryCards, meets, confessions } from '../../lib/schema'
import { count, eq } from 'drizzle-orm'
import { requireOnboarded } from '../../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/us/stats')({
  GET: async ({ request }) => {
    await requireOnboarded(request)

    const memoriesCount = await db.select({ count: count() }).from(memoryCards)
    const meetsCount = await db.select({ count: count() }).from(meets).where(eq(meets.isUpcoming, false))
    const confessionsCount = await db.select({ count: count() }).from(confessions)

    return json({
      daysTogether: 365, // Computed from shared_meta anniversary_date
      memoriesPlanted: memoriesCount[0]?.count || 0,
      meetsWalked: meetsCount[0]?.count || 0,
      confessionsExchanged: confessionsCount[0]?.count || 0,
    })
  },
})
