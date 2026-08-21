import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { homeHero } from '../lib/schema'
import { eq } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/home-hero')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const hero = await db.query.homeHero.findFirst({
      where: eq(homeHero.id, 1),
    })
    return json({ imageUrl: hero?.imageUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1600&q=80' })
  },
  PUT: async ({ request }) => {
    await requireOnboarded(request)
    const { imageUrl } = await request.json()
    if (!imageUrl) return json({ error: 'Image URL required' }, { status: 400 })

    const existing = await db.query.homeHero.findFirst({
      where: eq(homeHero.id, 1),
    })

    if (existing) {
      await db.update(homeHero).set({ imageUrl }).where(eq(homeHero.id, 1))
    } else {
      await db.insert(homeHero).values({ id: 1, imageUrl })
    }

    return json({ success: true, imageUrl })
  },
})
