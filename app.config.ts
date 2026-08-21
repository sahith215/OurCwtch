import { defineConfig } from 'vinxi'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  routers: [
    {
      name: 'public',
      type: 'static',
      dir: './public',
    },
    {
      name: 'ssr',
      type: 'http',
      handler: './app/ssr.tsx',
      target: 'server',
      plugins: () => [
        tsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
      ],
    },
    {
      name: 'client',
      type: 'spa',
      handler: './index.html',
      target: 'browser',
      plugins: () => [
        tsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
      ],
    },
  ],
})
