import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { user, passwordResetOtps } from '../../lib/schema'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const Route = createAPIFileRoute('/api/auth/verify-otp')({
  POST: async ({ request }) => {
    const { email, otp } = await request.json()
    if (!email || !otp) {
      return json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const targetUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    })

    if (!targetUser) {
      return json({ error: 'Invalid verification request' }, { status: 400 })
    }

    const latestOtp = await db.query.passwordResetOtps.findFirst({
      where: eq(passwordResetOtps.userId, targetUser.id),
      orderBy: [desc(passwordResetOtps.createdAt)],
    })

    if (!latestOtp) {
      return json({ error: 'No OTP requested' }, { status: 400 })
    }

    if (latestOtp.lockedUntil && new Date(latestOtp.lockedUntil) > new Date()) {
      return json({ error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' }, { status: 429 })
    }

    if (new Date(latestOtp.expiresAt) < new Date()) {
      return json({ error: 'OTP has expired' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash)
    if (!isValid) {
      const attempts = (latestOtp.attempts || 0) + 1
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null

      await db.update(passwordResetOtps)
        .set({ attempts, lockedUntil })
        .where(eq(passwordResetOtps.id, latestOtp.id))

      if (attempts >= 5) {
        return json({ error: 'Too many incorrect attempts. Locked for 15 minutes.' }, { status: 429 })
      }

      return json({ error: 'Invalid OTP code' }, { status: 400 })
    }

    // Issue short-lived token
    const resetToken = btoa(JSON.stringify({ userId: targetUser.id, otpId: latestOtp.id, exp: Date.now() + 15 * 60 * 1000 }))

    return json({ resetToken })
  },
})
