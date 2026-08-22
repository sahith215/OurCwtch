export class PersistenceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PersistenceError'
  }
}

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch {
    throw new PersistenceError('Could not reach the server. Your change was not saved.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new PersistenceError(payload.error || payload.message || `Save failed (${response.status}).`)
  }
  return payload as T
}

export function reportPersistenceError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Your change could not be saved.'
  window.dispatchEvent(new CustomEvent('persistence-error', { detail: message }))
}

export function reportPersistenceSuccess(message = 'Saved') {
  window.dispatchEvent(new CustomEvent('persistence-success', { detail: message }))
}
