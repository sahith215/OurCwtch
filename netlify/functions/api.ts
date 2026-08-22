import { handleApiRequest } from '../../app/lib/apiRouter'

type NetlifyEvent = {
  httpMethod: string
  rawUrl?: string
  path: string
  headers: Record<string, string | undefined>
  body?: string | null
  isBase64Encoded?: boolean
}

function getRequestUrl(event: NetlifyEvent) {
  const forwardedProto = event.headers['x-forwarded-proto'] || 'https'
  const host = event.headers.host || 'localhost'
  const sourceUrl = new URL(event.rawUrl || `${forwardedProto}://${host}${event.path}`)
  let pathname = sourceUrl.pathname.replace(/^\/.netlify\/functions\/api/, '')
  if (!pathname.startsWith('/api/')) pathname = `/api${pathname === '/' ? '' : pathname}`
  return `${forwardedProto}://${host}${pathname}${sourceUrl.search}`
}

export default async function handler(event: NetlifyEvent) {
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) headers.set(key, value)
    }

    const body = event.body
      ? event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body
      : undefined

    const request = new Request(getRequestUrl(event), {
      method: event.httpMethod,
      headers,
      body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : body,
    })
    const response = await handleApiRequest(request)
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      if (key !== 'set-cookie') responseHeaders[key] = value
    })
    const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
    const setCookies = getSetCookie?.call(response.headers)
    if (setCookies?.length) {
      return {
        statusCode: response.status,
        headers: responseHeaders,
        multiValueHeaders: { 'set-cookie': setCookies },
        body: await response.text(),
      }
    }
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      responseHeaders['set-cookie'] = setCookie
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: await response.text(),
    }
  } catch (error) {
    console.error('[Netlify API Error]', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}