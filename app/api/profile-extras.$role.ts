import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { profileExtras } from '../lib/schema'
import { eq } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/profile-extras/$role')({
  GET: async ({ request, params }) => {
    await requireOnboarded(request)
    const roleParam = params.role // 'Husband' | 'Wife'
    const record = await db.query.profileExtras.findFirst({
      where: eq(profileExtras.role, roleParam),
    })
    return json(record || { role: roleParam })
  },
  PUT: async ({ request, params }) => {
    const session = await requireOnboarded(request)
    const roleParam = params.role

    if (session.user.role !== roleParam) {
      return json({ error: 'Forbidden: Can only edit own profile' }, { status: 403 })
    }

    const body = await request.json()
    const existing = await db.query.profileExtras.findFirst({
      where: eq(profileExtras.role, roleParam),
    })

    if (existing) {
      await db.update(profileExtras)
        .set({
          tagline: body.tagline,
          favSong: body.favSong,
          comfortFood: body.comfortFood,
          loveLanguage: body.loveLanguage,
          quirk: body.quirk,
          obsession: body.obsession,
          photoUrl: body.photoUrl,
        })
        .where(eq(profileExtras.role, roleParam))
    } else {
      await db.insert(profileExtras).values({
        role: roleParam,
        tagline: body.tagline,
        favSong: body.favSong,
        comfortFood: body.comfortFood,
        loveLanguage: body.loveLanguage,
        quirk: body.quirk,
        obsession: body.obsession,
        photoUrl: body.photoUrl,
      })
    }

    return json({ success: true })
  },
})
