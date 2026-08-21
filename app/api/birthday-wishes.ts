import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { birthdayWishes } from '../lib/schema'
import { eq, and, ne } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/birthday-wishes')({
  GET: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const lastYear = new Date().getFullYear() - 1

    const priorWish = await db.query.birthdayWishes.findFirst({
      where: and(
        ne(birthdayWishes.authorRole, currentRole),
        eq(birthdayWishes.year, lastYear),
        eq(birthdayWishes.shownToPartner, false)
      ),
    })

    if (priorWish) {
      await db.update(birthdayWishes)
        .set({ shownToPartner: true })
        .where(eq(birthdayWishes.id, priorWish.id))
    }

    return json({ wish: priorWish ? priorWish.text : null })
  },
  POST: async ({ request }) => {
    const session = await requireOnboarded(request)
    const currentRole = session.user.role || 'Husband'
    const currentYear = new Date().getFullYear()
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return json({ error: 'Text required' }, { status: 400 })
    }

    // Check if wish exists for role + year
    const existing = await db.query.birthdayWishes.findFirst({
      where: and(
        eq(birthdayWishes.authorRole, currentRole),
        eq(birthdayWishes.year, currentYear)
      ),
    })

    if (existing) {
      return json({ error: 'Wish already submitted for this year' }, { status: 409 })
    }

    await db.insert(birthdayWishes).values({
      id: crypto.randomUUID(),
      authorRole: currentRole,
      text: text.trim(),
      year: currentYear,
    })

    return json({ success: true })
  },
})
