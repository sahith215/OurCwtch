import { auth } from './auth'
import { db } from './db'
import {
  user,
  passwordResetOtps,
  homeHero,
  birthdayWishes,
  memoryCards,
  confessions,
  meets,
  profileExtras,
  privateLoveLines,
  thisOrThatAnswers,
  funFacts,
  playlistMeta,
  sharedMeta,
} from './schema'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sendOtpEmail } from './emailService'

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method.toUpperCase()

  // 1. Role Status Check
  if (path.startsWith('/api/auth/role-status/')) {
    const roleParam = decodeURIComponent(path.replace('/api/auth/role-status/', ''))
    if (roleParam !== 'Husband' && roleParam !== 'Wife') {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }
    const existingUser = await db.query.user.findFirst({
      where: eq(user.role, roleParam),
    })
    return Response.json({ taken: !!existingUser })
  }

  // 2. Forgot Password OTP
  if (path === '/api/auth/forgot-password' && method === 'POST') {
    const { email } = await request.json().catch(() => ({}))
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

    const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) })
    if (existingUser) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpHash = await bcrypt.hash(otp, 10)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      await db.insert(passwordResetOtps).values({
        id: crypto.randomUUID(),
        userId: existingUser.id,
        otpHash,
        expiresAt,
      })

      await sendOtpEmail(email, otp).catch(() => {})
    }

    return Response.json({ message: 'If that email exists, a code was sent.' })
  }

  // 3. Verify OTP
  if (path === '/api/auth/verify-otp' && method === 'POST') {
    const { email, otp } = await request.json().catch(() => ({}))
    if (!email || !otp) return Response.json({ error: 'Email and OTP are required' }, { status: 400 })

    const u = await db.query.user.findFirst({ where: eq(user.email, email) })
    if (!u) return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 })

    const records = await db.query.passwordResetOtps.findMany({ where: eq(passwordResetOtps.userId, u.id) })
    let validRecord = null
    for (const record of records) {
      if (new Date(record.expiresAt) > new Date()) {
        const matches = await bcrypt.compare(otp, record.otpHash)
        if (matches) {
          validRecord = record
          break
        }
      }
    }

    if (!validRecord) return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    const resetToken = crypto.randomUUID()
    return Response.json({ resetToken })
  }

  // 4. Reset Password
  if (path === '/api/auth/reset-password' && method === 'POST') {
    const { email, resetToken, newPassword } = await request.json().catch(() => ({}))
    if (!email || !resetToken || !newPassword) return Response.json({ error: 'Missing parameters' }, { status: 400 })

    const u = await db.query.user.findFirst({ where: eq(user.email, email) })
    if (!u) return Response.json({ error: 'User not found' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.update(user).set({ password: hashedPassword }).where(eq(user.id, u.id)).catch(() => {})
    return Response.json({ success: true })
  }

  // Delegate all remaining /api/auth/* routes to Better Auth handler
  if (path.startsWith('/api/auth/')) {
    return auth.handler(request)
  }

  // 5. Shared Meta Anniversary Date
  if (path === '/api/shared-meta/anniversary_date' && method === 'POST') {
    const { value } = await request.json().catch(() => ({}))
    if (!value) return Response.json({ error: 'Value required' }, { status: 400 })

    const existing = await db.query.sharedMeta.findFirst({
      where: eq(sharedMeta.key, 'anniversary_date'),
    })

    if (!existing) {
      await db.insert(sharedMeta).values({ key: 'anniversary_date', value })
      return Response.json({ success: true })
    }

    if (existing.value !== value) {
      return Response.json({ error: 'Anniversary date mismatch' }, { status: 400 })
    }

    return Response.json({ success: true })
  }

  if (path === '/api/shared-meta/nickname') {
    if (method === 'GET') {
      const husbandNick = await db.query.sharedMeta.findFirst({ where: eq(sharedMeta.key, 'husband_nickname') })
      const wifeNick = await db.query.sharedMeta.findFirst({ where: eq(sharedMeta.key, 'wife_nickname') })
      return Response.json({
        husband_nickname: husbandNick?.value || '',
        wife_nickname: wifeNick?.value || '',
      })
    }
    if (method === 'POST') {
      const { value, key: nickKey } = await request.json().catch(() => ({}))
      if (!value) return Response.json({ error: 'Value required' }, { status: 400 })

      // Accept explicit key or default to 'nickname'
      const metaKey = nickKey || 'nickname'

      const existing = await db.query.sharedMeta.findFirst({
        where: eq(sharedMeta.key, metaKey),
      })

      if (!existing) {
        await db.insert(sharedMeta).values({ key: metaKey, value })
      } else {
        await db.update(sharedMeta).set({ value }).where(eq(sharedMeta.key, metaKey))
      }
      return Response.json({ success: true })
    }
  }

  // 7. Standard better-auth endpoints (/api/auth/sign-up/email, /api/auth/sign-in/email, etc.)
  if (path.startsWith('/api/auth/')) {
    return auth.handler(request)
  }

  // 8. Complete Onboarding
  if (path === '/api/user/complete-onboarding' && method === 'PATCH') {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await db.update(user).set({ onboardingComplete: true }).where(eq(user.id, session.user.id))
    return Response.json({ success: true })
  }

  // 9. Home Hero
  if (path === '/api/home-hero') {
    if (method === 'GET') {
      const hero = await db.query.homeHero.findFirst()
      return Response.json({ imageUrl: hero?.imageUrl || '/hero-couple.jpg' })
    }
    if (method === 'PUT') {
      const { imageUrl } = await request.json().catch(() => ({}))
      const existing = await db.query.homeHero.findFirst()
      if (existing) {
        await db.update(homeHero).set({ imageUrl }).where(eq(homeHero.id, 1))
      } else {
        await db.insert(homeHero).values({ id: 1, imageUrl })
      }
      return Response.json({ success: true })
    }
  }

  // 10. Birthday Wishes
  if (path === '/api/birthday-wishes') {
    if (method === 'GET') {
      const year = new Date().getFullYear()
      const wish = await db.query.birthdayWishes.findFirst({ where: eq(birthdayWishes.year, year) })
      return Response.json({ wish: wish?.text || null })
    }
    if (method === 'POST') {
      const { text } = await request.json().catch(() => ({}))
      const year = new Date().getFullYear()
      const session = await auth.api.getSession({ headers: request.headers })
      const authorRole = (session?.user as any)?.role || 'Husband'
      const existing = await db.query.birthdayWishes.findFirst({ where: eq(birthdayWishes.year, year) })
      if (existing) return Response.json({ error: 'Wish already made this year' }, { status: 409 })

      const id = crypto.randomUUID()
      await db.insert(birthdayWishes).values({ id, authorRole, year, text })
      return Response.json({ id, authorRole, year, text })
    }
  }

  // 11. Memories
  if (path === '/api/memories') {
    if (method === 'GET') {
      const list = await db.query.memoryCards.findMany({ orderBy: [desc(memoryCards.reasonNumber)] })
      return Response.json(list)
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const id = crypto.randomUUID()
      await db.insert(memoryCards).values({ id, ...body })
      return Response.json({ id, ...body })
    }
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}))
      await db.update(memoryCards).set({
        title: body.title,
        subtitle: body.subtitle,
        note: body.note,
        photoUrl: body.photoUrl,
      }).where(eq(memoryCards.id, body.id))
      return Response.json({ success: true })
    }
    if (method === 'DELETE') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (!id) return Response.json({ error: 'ID required' }, { status: 400 })
      await db.delete(memoryCards).where(eq(memoryCards.id, id))
      return Response.json({ success: true })
    }
  }

  // 12. Us Stats
  if (path === '/api/us/stats' && method === 'GET') {
    const annMeta = await db.query.sharedMeta.findFirst({ where: eq(sharedMeta.key, 'anniversary_date') })
    let daysTogether = 365
    if (annMeta?.value) {
      const startDate = new Date(annMeta.value).getTime()
      const now = Date.now()
      const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
      daysTogether = Math.max(0, diffDays)
    }

    const memCount = (await db.query.memoryCards.findMany()).length
    const meetsCount = (await db.query.meets.findMany()).length
    const confCount = (await db.query.confessions.findMany()).length
    return Response.json({
      daysTogether,
      memoriesPlanted: memCount,
      meetsWalked: meetsCount,
      confessionsExchanged: confCount,
    })
  }

  // 13. Confessions
  if (path === '/api/confessions') {
    if (method === 'GET') {
      const list = await db.query.confessions.findMany({ orderBy: [desc(confessions.createdAt)] })
      return Response.json(list)
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const session = await auth.api.getSession({ headers: request.headers })
      const authorRole = (session?.user as any)?.role || 'Husband'
      const id = crypto.randomUUID()
      await db.insert(confessions).values({ id, authorRole, ...body })
      return Response.json({ id, authorRole, ...body })
    }
  }

  if (path.startsWith('/api/confessions/') && path.endsWith('/open') && method === 'PATCH') {
    const id = path.replace('/api/confessions/', '').replace('/open', '')
    const session = await auth.api.getSession({ headers: request.headers })
    const openedByRole = (session?.user as any)?.role || 'Wife'
    await db.update(confessions).set({ openedAt: new Date().toISOString(), openedByRole }).where(eq(confessions.id, id))
    return Response.json({ success: true })
  }

  // 14. Meets
  if (path === '/api/meets') {
    if (method === 'GET') {
      const list = await db.query.meets.findMany()
      // Return with photoUrls array for frontend compatibility
      const mapped = list.map((m: any) => ({
        ...m,
        bestMemory: m.bestMemory || m.note || '',
        photoUrls: m.photoUrl ? (m.photoUrl.startsWith('[') ? JSON.parse(m.photoUrl) : [m.photoUrl]) : [],
        soundtrack: m.soundtrack || '',
        moodTag: m.moodTag || '',
        location: m.location || '',
      }))
      return Response.json(mapped)
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const id = crypto.randomUUID()
      const photoUrlStr = Array.isArray(body.photoUrls) ? JSON.stringify(body.photoUrls) : (body.photoUrl || '')
      const newMeet = {
        id,
        title: body.title || '',
        note: body.bestMemory || body.note || '',
        photoUrl: photoUrlStr,
        date: body.date || '',
        location: body.location || '',
        bestMemory: body.bestMemory || body.note || '',
        soundtrack: body.soundtrack || '',
        moodTag: body.moodTag || '',
        timeOfDay: body.timeOfDay || 'day',
        order: body.order || 1,
        isUpcoming: body.isUpcoming || false,
      }
      await db.insert(meets).values(newMeet)
      return Response.json({
        ...newMeet,
        photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [photoUrlStr],
      })
    }
    if (method === 'DELETE') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (!id) return Response.json({ error: 'ID required' }, { status: 400 })
      await db.delete(meets).where(eq(meets.id, id))
      return Response.json({ success: true })
    }
  }

  // 15. Profile Extras
  if (path.startsWith('/api/profile-extras/')) {
    let roleStr = decodeURIComponent(path.replace('/api/profile-extras/', ''))
    if (roleStr === 'me') {
      const session = await auth.api.getSession({ headers: request.headers })
      roleStr = (session?.user as any)?.role || 'Husband'
    }
    const role = roleStr as 'Husband' | 'Wife'
    if (method === 'GET') {
      const profile = await db.query.profileExtras.findFirst({ where: eq(profileExtras.role, role) })
      return Response.json(profile || {})
    }
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}))
      const existing = await db.query.profileExtras.findFirst({ where: eq(profileExtras.role, role) })
      if (existing) {
        await db.update(profileExtras).set(body).where(eq(profileExtras.role, role))
      } else {
        await db.insert(profileExtras).values({ role, ...body })
      }
      return Response.json({ success: true })
    }
  }

  // 16. Private Love Lines
  if (path === '/api/private-love-lines' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const session = await auth.api.getSession({ headers: request.headers })
    const authorRole = (session?.user as any)?.role || 'Husband'
    const targetRole = authorRole === 'Husband' ? 'Wife' : 'Husband'
    const id = crypto.randomUUID()
    await db.insert(privateLoveLines).values({ id, authorRole, targetRole, ...body })
    return Response.json({ id, authorRole, targetRole, ...body })
  }

  // 17. This or That
  if (path === '/api/this-or-that') {
    if (method === 'GET') {
      const list = await db.query.thisOrThatAnswers.findMany()
      // Return as a keyed object: { questionKey: { Husband: answer, Wife: answer } }
      const result: Record<string, Record<string, string>> = {}
      for (const item of list) {
        if (!result[item.questionKey]) result[item.questionKey] = {}
        result[item.questionKey][item.role] = item.answer
      }
      return Response.json(result)
    }
    if (method === 'POST') {
      const { questionKey, answer } = await request.json().catch(() => ({}))
      const session = await auth.api.getSession({ headers: request.headers })
      const role = (session?.user as any)?.role || 'Husband'
      const id = crypto.randomUUID()
      await db.insert(thisOrThatAnswers).values({ id, role, questionKey, answer })
      return Response.json({ id, role, questionKey, answer })
    }
  }

  // 18. Fun Facts
  if (path === '/api/fun-facts') {
    if (method === 'GET') {
      const list = await db.query.funFacts.findMany()
      return Response.json(list)
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const session = await auth.api.getSession({ headers: request.headers })
      const addedByRole = (session?.user as any)?.role || 'Husband'
      const id = crypto.randomUUID()
      await db.insert(funFacts).values({ id, addedByRole, ...body })
      return Response.json({ id, addedByRole, ...body })
    }
  }

  // 19. Playlist Meta
  if (path === '/api/playlist-meta' && method === 'GET') {
    const meta = await db.query.playlistMeta.findFirst()
    return Response.json(meta || { title: 'Sound of Us', embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M' })
  }

  return Response.json({ error: 'Not Found' }, { status: 404 })
}
