// Vercel serverless function for POST /api/ai/chat
//
// This is the production counterpart to the `aiChatProxy` middleware in
// vite.config.js. Both delegate to server/aiChatCore.js so the dev and
// production behaviour stay identical.
//
// NOTE: anything placed inside /api is deployed as a function, so shared
// helpers live in /server instead.

import { clientKeyFrom, createRateLimiter, handleChat } from '../../server/aiChatCore.js'

// Warm-instance reuse lets the rate limiter actually accumulate state.
export const config = {
  maxDuration: 30,
}

// Module scope persists across invocations on a warm instance.
const checkRateLimit = createRateLimiter()

export default async function handler(req, res) {
  // Vercel routes by path, not method, so guard explicitly.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // The client needs the response as application/json; without this the
  // browser gets text/html and res.json() throws a SyntaxError.
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')

  const { status, headers, body } = await handleChat({
    messages: req.body?.messages,
    // Serverless context: plain process.env. All three vars must be present
    // in the Vercel project's environment variables.
    env: process.env,
    checkRateLimit,
    clientKey: clientKeyFrom(req.headers),
  })

  if (headers) {
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value)
  }

  return res.status(status).json(body)
}
