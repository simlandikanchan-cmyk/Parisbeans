import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { clientKeyFrom, createRateLimiter, handleChat } from './server/aiChatCore.js'

// Dev-only proxy for the AI concierge, so the API key stays server-side.
// Production is served by the identical handler in api/ai/chat.js — both
// delegate to server/aiChatCore.js so the two paths cannot drift.
function aiChatProxy() {
  const checkRateLimit = createRateLimiter()

  return {
    name: 'ai-chat-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        let raw = ''
        for await (const chunk of req) raw += chunk
        let payload = {}
        try {
          payload = JSON.parse(raw || '{}')
        } catch {
          payload = {}
        }

        const { status, headers, body } = await handleChat({
          messages: payload.messages,
          // Vite dev: loadEnv reads .env files and exposes every key, including
          // the non-VITE_ prefixed ones we need server-side.
          env: loadEnv(server.config.mode, process.cwd(), ''),
          checkRateLimit,
          clientKey: clientKeyFrom(req.headers),
        })

        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        for (const [key, value] of Object.entries(headers || {})) {
          res.setHeader(key, value)
        }
        res.end(JSON.stringify(body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    aiChatProxy(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|svg|webp|avif)$/i,
      includePublic: false,
      logStats: true,
      png: { quality: 85 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80, lossless: false },
      avif: { quality: 75, lossless: false },
      svg: { multipass: true },
      cache: true,
      cacheLocation: 'node_modules/.cache/vite-plugin-image-optimizer',
      exclude: [
        /story\/img1\.png$/,
        /story\/img_phone\.png$/,
        /story\/Frame 48096464 \(1\)\.png$/,
      ],
    }),
  ],
})