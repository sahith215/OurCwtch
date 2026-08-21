import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { user, passwordResetOtps } from '../../lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sendOtpEmail } from '../../lib/mailer'

export const Route = createAPIFileRoute('/api/auth/forgot-password')({
  POST: async ({ request }) => {
    const { email } = await request.json()
    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 })
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    })

    if (existingUser) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpHash = await bcrypt.hash(otp, 10)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

      await db.insert(passwordResetOtps).values({
        id: crypto.randomUUID(),
        userId: existingUser.id,
        otpHash,
        expiresAt,
      })

      await sendOtpEmail(email, otp)
    }

    return json({ message: 'If that email exists, a code was sent.' })
  },
})
