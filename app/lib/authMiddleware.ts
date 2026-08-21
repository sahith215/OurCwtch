import { auth } from './auth'

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session || !session.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return session
}

export async function requireOnboarded(request: Request) {
  const session = await requireSession(request)

  if (!session.user.onboardingComplete) {
    throw new Response(JSON.stringify({ error: 'Onboarding required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return session
}
