import { handleApiRequest } from '../../app/lib/apiRouter'

function getApiRequestUrl(request: Request) {
  const sourceUrl = new URL(request.url)
  let pathname = sourceUrl.pathname.replace(/^\/.netlify\/functions\/api/, '')
  if (!pathname.startsWith('/api/')) pathname = `/api${pathname === '/' ? '' : pathname}`
  return `${sourceUrl.origin}${pathname}${sourceUrl.search}`
}

export default async function handler(request: Request) {
  try {
    return await handleApiRequest(new Request(getApiRequestUrl(request), request))
  } catch (error) {
    console.error('[Netlify API Error]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}