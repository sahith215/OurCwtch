import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

function apiPlugin(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next()
        }

        try {
          const { handleApiRequest } = await server.ssrLoadModule('./app/lib/apiRouter.ts')

          const protocol = req.socket && 'encrypted' in req.socket && (req.socket as any).encrypted ? 'https' : 'http'
          const host = req.headers.host || 'localhost:3000'
          const fullUrl = new URL(req.url, `${protocol}://${host}`)

          const bodyChunks: Buffer[] = []
          req.on('data', (chunk) => bodyChunks.push(chunk))
          await new Promise((resolve) => req.on('end', resolve))
          const bodyBuffer = Buffer.concat(bodyChunks)

          const webRequest = new Request(fullUrl.toString(), {
            method: req.method,
            headers: req.headers as any,
            body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : bodyBuffer,
          })

          const response = await handleApiRequest(webRequest)

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })

          const arrayBuffer = await response.arrayBuffer()
          res.end(Buffer.from(arrayBuffer))
        } catch (err: any) {
          console.error('API Error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    apiPlugin(),
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      'seroval-plugins/web': path.resolve(__dirname, 'node_modules/seroval-plugins/dist/web.cjs'),
    },
  },
  ssr: {
    external: ['nodemailer', 'better-auth', '@libsql/client'],
  },
  server: {
    port: 3000,
  },
})
