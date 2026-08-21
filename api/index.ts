import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApiRequest } from '../app/lib/apiRouter'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https'
    const host = req.headers.host || 'localhost'
    const fullUrl = new URL(req.url || '/', `${protocol}://${host}`)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value && key.toLowerCase() !== 'content-length') {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v))
        } else {
          headers.append(key, value)
        }
      }
    }

    let bodyBuffer: Buffer | undefined = undefined
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      if (req.body) {
        bodyBuffer = typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body))
      }
    }

    const webRequest = new Request(fullUrl.toString(), {
      method: req.method,
      headers,
      body: bodyBuffer,
    })

    const response = await handleApiRequest(webRequest)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    const arrayBuffer = await response.arrayBuffer()
    res.end(Buffer.from(arrayBuffer))
  } catch (err: any) {
    console.error('Vercel API Error:', err)
    res.status(500).json({ error: err.message })
  }
}
