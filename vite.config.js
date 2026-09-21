import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// Dev-only proxy for the Agentic AI assistant. Keeps the API key server-side.
// In production, deploy the same handler as a serverless function (see README note).
function aiChatProxy() {
  return {
    name: 'ai-chat-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        const env = loadEnv(server.config.mode, process.cwd(), '')
        const endpoint = env.VITE_AI_ENDPOINT
        const apiKey = env.VITE_AI_API_KEY
        const model = env.VITE_AI_MODEL

        if (!endpoint || !apiKey || !model) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'AI assistant is not configured yet. Add VITE_AI_ENDPOINT, VITE_AI_API_KEY and VITE_AI_MODEL to .env, then restart the dev server.',
            })
          )
          return
        }

        let raw = ''
        for await (const chunk of req) raw += chunk
        let payload = {}
        try {
          payload = JSON.parse(raw || '{}')
        } catch {
          payload = {}
        }
        const messages = Array.isArray(payload.messages) ? payload.messages : []

        const systemPrompt = [
          'You are the "agentic" concierge for Paris Beans, a Paris-inspired café inside the HAIR RAP BY YOYO salon in Ahmedabad, India.',
          'Facts you can rely on:',
          '- Address: 1st floor, Shilp Satved, Sindhubhavan Rd, Bodakdev, Ahmedabad, Gujarat 380059.',
          '- Hours: 10:00 AM - 9:00 PM, Monday to Sunday.',
          '- Phone / WhatsApp: +91 90999 38886',
          '- Email: hello@parisbeans.com',
          '- Site pages: Home (/), Our Story (/our-story), Menu (/menu), Gallery (/gallery), Visit & Contact (/visit-contact).',
          'Answer warmly and concisely in plain text with short paragraphs. If you do not know something, say so honestly and suggest contacting the café directly.',
        ]
          .join('\n')
          .trim()

        try {
          const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
              temperature: 0.6,
            }),
          })

          if (!upstream.ok) {
            const detail = await upstream.text()
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({ error: `AI upstream error (${upstream.status})`, detail })
            )
            return
          }

          const data = await upstream.json()
          const reply = data?.choices?.[0]?.message?.content ?? ''
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ reply }))
        } catch (err) {
          console.error('[ai-chat]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Request to the AI assistant failed' }))
        }
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
      includePublic: true,
      logStats: true,
      png: { quality: 85 },
      jpeg: { quality: 85 },
      jpg: { quality: 85 },
      webp: { quality: 85, lossless: false },
      avif: { quality: 75, lossless: false },
      svg: { multipass: true },
      cache: true,
      cacheLocation: 'node_modules/.cache/vite-plugin-image-optimizer',
    }),
  ],
})