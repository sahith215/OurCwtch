import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { user } from '../../lib/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '../../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/user/complete-onboarding')({
  PATCH: async ({ request }) => {
    const session = await requireSession(request)

    await db.update(user)
      .set({ onboardingComplete: true })
      .where(eq(user.id, session.user.id))

    return json({ success: true })
  },
})
