import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'

export const auth = betterAuth({
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
