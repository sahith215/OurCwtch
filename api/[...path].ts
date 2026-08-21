import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApiRequest } from '../app/lib/apiRouter.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https'
    const host = req.headers.host || 'our-cwtch.vercel.app'
    const fullUrl = new URL(req.url || '/', `${protocol}://${host}`)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (
        value &&
        key.toLowerCase() !== 'content-length' &&
        key.toLowerCase() !== 'connection' &&
        key.toLowerCase() !== 'host' &&
        key.toLowerCase() !== 'transfer-encoding'
      ) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v))
        } else {
          headers.append(key, value)
        }
      }
    }

    let body: string | undefined = undefined
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
        headers.set('content-type', headers.get('content-type') || 'application/json')
        headers.set('content-length', Buffer.byteLength(body).toString())
      }
    }

    const webRequest = new Request(fullUrl.toString(), {
      method: req.method,
      headers,
      body,
    })

    const response = await handleApiRequest(webRequest)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    const arrayBuffer = await response.arrayBuffer()
    res.end(Buffer.from(arrayBuffer))
  } catch (err: any) {
    console.error('[Vercel API Error]', err?.message, err?.stack)
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 500
    res.end(JSON.stringify({ error: err?.message || 'Internal server error' }))
  }
}
