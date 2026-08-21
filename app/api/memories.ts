import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { memoryCards } from '../lib/schema'
import { eq, desc } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/memories')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const list = await db.query.memoryCards.findMany({
      orderBy: [desc(memoryCards.reasonNumber)],
    })
    return json(list)
  },
  POST: async ({ request }) => {
    await requireOnboarded(request)
    const body = await request.json()
    const newCard = {
      id: crypto.randomUUID(),
      reasonNumber: body.reasonNumber || 1,
      title: body.title,
      subtitle: body.subtitle,
      note: body.note,
      photoUrl: body.photoUrl,
      imgZoom: body.imgZoom || 1.0,
      imgX: body.imgX || 0,
      imgY: body.imgY || 0,
    }
    await db.insert(memoryCards).values(newCard)
    return json(newCard)
  },
  PUT: async ({ request }) => {
    await requireOnboarded(request)
    const body = await request.json()
    await db.update(memoryCards)
      .set({
        title: body.title,
        subtitle: body.subtitle,
        note: body.note,
        photoUrl: body.photoUrl,
        imgZoom: body.imgZoom,
        imgX: body.imgX,
        imgY: body.imgY,
      })
      .where(eq(memoryCards.id, body.id))
    return json({ success: true })
  },
  DELETE: async ({ request }) => {
    await requireOnboarded(request)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return json({ error: 'ID required' }, { status: 400 })
    await db.delete(memoryCards).where(eq(memoryCards.id, id))
    return json({ success: true })
  },
})
