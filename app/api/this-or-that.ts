import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { thisOrThatAnswers } from '../lib/schema'
import { requireOnboarded } from '../lib/authMiddleware'
import { eq } from 'drizzle-orm'

export const Route = createAPIFileRoute('/api/this-or-that')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const list = await db.query.thisOrThatAnswers.findMany()
    return json(list)
  },
  POST: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const { questionKey, answer } = await request.json()

    if (!questionKey || !answer) {
      return json({ error: 'Question key and answer required' }, { status: 400 })
    }

    const newAnswer = {
      id: crypto.randomUUID(),
      role: currentRole,
      questionKey,
      answer,
    }

    await db.insert(thisOrThatAnswers)
      .values(newAnswer)
      .onConflictDoUpdate({
        target: [thisOrThatAnswers.role, thisOrThatAnswers.questionKey],
        set: { answer },
      })

    return json({ success: true })
  },
})
