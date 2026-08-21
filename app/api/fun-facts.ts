import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { funFacts } from '../lib/schema'
import { asc } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/fun-facts')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const list = await db.query.funFacts.findMany({
      orderBy: [asc(funFacts.order)],
    })
    return json(list)
  },
  POST: async ({ request }) => {
    await requireOnboarded(request)
    const { body } = await request.json()
    if (!body || !body.trim()) return json({ error: 'Body required' }, { status: 400 })

    const existingCount = await db.query.funFacts.findMany()
    const newFact = {
      id: crypto.randomUUID(),
      body: body.trim(),
      order: existingCount.length + 1,
    }

    await db.insert(funFacts).values(newFact)
    return json(newFact)
  },
})
