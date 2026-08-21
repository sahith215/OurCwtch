import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { user, session, passwordResetOtps } from '../../lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const Route = createAPIFileRoute('/api/auth/reset-password')({
  POST: async ({ request }) => {
    const { resetToken, newPassword } = await request.json()

    if (!resetToken || !newPassword) {
      return json({ error: 'Reset token and new password are required' }, { status: 400 })
    }

    let payload: { userId: string; otpId: string; exp: number }
    try {
      payload = JSON.parse(atob(resetToken))
    } catch {
      return json({ error: 'Invalid reset token' }, { status: 400 })
    }

    if (Date.now() > payload.exp) {
      return json({ error: 'Reset token expired' }, { status: 400 })
    }

    // Invalidate OTP record
    await db.update(passwordResetOtps)
      .set({ attempts: 99 })
      .where(eq(passwordResetOtps.id, payload.otpId))

    // Invalidate all sessions for user
    await db.delete(session).where(eq(session.userId, payload.userId))

    // Update password (better-auth account password update)
    // Note: better-auth email/password credentials stored in account or user table
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.update(user).set({ passwordHash }).where(eq(user.id, payload.userId))

    return json({ success: true, message: 'Password updated. Please log in again.' })
  },
})
