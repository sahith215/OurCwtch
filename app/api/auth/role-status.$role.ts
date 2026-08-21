import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { db } from '../../lib/db'
import { user } from '../../lib/schema'
import { eq } from 'drizzle-orm'

export const Route = createAPIFileRoute('/api/auth/role-status/$role')({
  GET: async ({ params }) => {
    const roleParam = params.role // 'Husband' | 'Wife'
    if (roleParam !== 'Husband' && roleParam !== 'Wife') {
      return json({ error: 'Invalid role' }, { status: 400 })
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.role, roleParam),
    })

    return json({ taken: !!existingUser })
  },
})
