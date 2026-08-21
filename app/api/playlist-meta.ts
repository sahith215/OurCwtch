import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../lib/db'
import { playlistMeta } from '../lib/schema'
import { eq } from 'drizzle-orm'
import { requireOnboarded } from '../lib/authMiddleware'

export const Route = createAPIFileRoute('/api/playlist-meta')({
  GET: async ({ request }) => {
    await requireOnboarded(request)
    const record = await db.query.playlistMeta.findFirst({
      where: eq(playlistMeta.id, 1),
    })
    return json(record || { spotifyUrl: null, subtitle: 'every song that sounds like you', trackCount: 38, totalDuration: '2h 14m' })
  },
  PUT: async ({ request }) => {
    await requireOnboarded(request)
    const body = await request.json()

    const existing = await db.query.playlistMeta.findFirst({
      where: eq(playlistMeta.id, 1),
    })

    if (existing) {
      await db.update(playlistMeta)
        .set({
          spotifyUrl: body.spotifyUrl,
          subtitle: body.subtitle,
          trackCount: body.trackCount,
          totalDuration: body.totalDuration,
        })
        .where(eq(playlistMeta.id, 1))
    } else {
      await db.insert(playlistMeta).values({
        id: 1,
        spotifyUrl: body.spotifyUrl,
        subtitle: body.subtitle,
        trackCount: body.trackCount,
        totalDuration: body.totalDuration,
      })
    }

    return json({ success: true })
  },
})
