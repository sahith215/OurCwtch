import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApiRequest } from '../app/lib/apiRouter'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers.host || 'localhost'
    const url = new URL(req.url || '/', ${protocol}://System.Management.Automation.Internal.Host.InternalHost)

    let bodyBuffer: Buffer | undefined = undefined
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      if (req.body) {
        bodyBuffer = typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body))
      }
    }

    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as any,
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
