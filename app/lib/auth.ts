import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || 'ourcwtch-secret-key-2026',
  baseURL: process.env.BETTER_AUTH_URL || 'https://our-cwtch.vercel.app',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
      },
      onboardingComplete: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    },
  },
})

export type SessionPayload = {
  user: {
    id: string
    email: string
    role?: 'Husband' | 'Wife' | null
    onboardingComplete?: boolean
  }
  session: {
    id: string
    userId: string
    expiresAt: Date
  }
}
