import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { meets } from '../lib/schema'
import { eq, asc } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/meets')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const list = await db.query.meets.findMany({
      orderBy: [asc(meets.order)],
    })
    return json(list)
  },
  POST: async ({ request }) => {
    await requireOnboarded(request)
    const body = await request.json()

    if (body.isUpcoming) {
      // Archive existing upcoming meet if new upcoming meet is created
      await db.update(meets).set({ isUpcoming: false }).where(eq(meets.isUpcoming, true))
    }

    const newMeet = {
      id: crypto.randomUUID(),
      title: body.title,
      note: body.note,
      photoUrl: body.photoUrl,
      date: body.date,
      timeOfDay: body.timeOfDay || 'day',
      order: body.order || 1,
      isUpcoming: body.isUpcoming || false,
    }

    await db.insert(meets).values(newMeet)
    return json(newMeet)
  },
  PUT: async ({ request }) => {
    await requireOnboarded(request)
    const body = await request.json()
    await db.update(meets)
      .set({
        title: body.title,
        note: body.note,
        photoUrl: body.photoUrl,
        date: body.date,
        timeOfDay: body.timeOfDay,
        isUpcoming: body.isUpcoming,
      })
      .where(eq(meets.id, body.id))
    return json({ success: true })
  },
  DELETE: async ({ request }) => {
    await requireOnboarded(request)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return json({ error: 'ID required' }, { status: 400 })

    await db.delete(meets).where(eq(meets.id, id))
    return json({ success: true })
  },
})
