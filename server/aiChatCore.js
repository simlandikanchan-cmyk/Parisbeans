// Shared AI chat core.
//
// Imported by BOTH the Vite dev middleware (vite.config.js) and the Vercel
// serverless function (api/ai/chat.js) so the two paths can never drift.
//
// Plain ESM, zero dependencies, so it bundles cleanly under both Vite's config
// loader and Vercel's Node builder.

export const AI_SYSTEM_PROMPT = [
  'You are the "agentic" concierge for Paris Beans, a Paris-inspired café inside the HAIR RAP BY YOYO salon in Ahmedabad, India.',
  'Facts you can rely on:',
  '- Address: 1st floor, Shilp Satved, Sindhubhavan Rd, Bodakdev, Ahmedabad, Gujarat 380059.',
  '- Hours: 10:00 AM - 9:00 PM, Monday to Sunday.',
  '- Phone / WhatsApp: +91 90999 38886',
  '- Email: support@parisbeans.com',
  '- Site pages: Home (/), Our Story (/our-story), Menu (/menu), Gallery (/gallery), Visit & Contact (/visit-contact).',
  'Answer warmly and concisely in plain text with short paragraphs. If you do not know something, say so honestly and suggest contacting the café directly.',
]
  .join('\n')
  .trim()

export const LIMITS = {
  // Cap on how much the model may generate. Keeps a single request cheap and
  // stops the widget from ever rendering a runaway wall of text.
  MAX_OUTPUT_TOKENS: 500,
  // Only the tail of the conversation is forwarded, so a long chat cannot
  // inflate request size / cost without bound.
  MAX_MESSAGES: 24,
  // Per-message character cap, applied after trimming.
  MAX_MESSAGE_CHARS: 2000,
  TEMPERATURE: 0.6,
  // Upstream request timeout (ms) so a hung provider cannot pin the function.
  UPSTREAM_TIMEOUT_MS: 20000,
  // Basic abuse protection: per-client-IP sliding window.
  RATE_LIMIT_MAX: 20,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
}

const ALLOWED_ROLES = new Set(['user', 'assistant'])

/**
 * Normalise untrusted client-supplied history into a safe, bounded array.
 *
 * Security note: the client controls the raw `messages` array, so without this
 * filter a caller could inject `{ role: 'system' }` entries and override the
 * concierge persona. Only user/assistant turns are allowed through, the
 * trusted system prompt is prepended server-side, and empty content is dropped.
 */
export function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []

  const cleaned = messages
    .filter((m) => m && typeof m === 'object')
    .filter((m) => ALLOWED_ROLES.has(m.role))
    .map((m) => ({
      role: m.role,
      content: String(m.content ?? '')
        .slice(0, LIMITS.MAX_MESSAGE_CHARS)
        .trim(),
    }))
    .filter((m) => m.content.length > 0)

  return cleaned.slice(-LIMITS.MAX_MESSAGES)
}

/**
 * Fixed-window-per-IP rate limiter held in module memory.
 *
 * Serverless instances are ephemeral and scale horizontally, so this is a
 * best-effort brake against a single runaway client rather than a hard global
 * guarantee. It is still meaningful: it caps burst volume per warm instance.
 */
export function createRateLimiter({ max = LIMITS.RATE_LIMIT_MAX, windowMs = LIMITS.RATE_LIMIT_WINDOW_MS } = {}) {
  // key -> { count, first } where `first` is the window start timestamp.
  const hits = new Map()

  return function check(key) {
    const now = Date.now()
    const entry = hits.get(key)

    // No entry, or the window has rolled over: start a fresh window.
    if (!entry || now - entry.first >= windowMs) {
      hits.set(key, { count: 1, first: now })

      // Prune expired entries so the Map cannot grow without bound.
      if (hits.size > 5000) {
        for (const [k, v] of hits) {
          if (now - v.first >= windowMs) hits.delete(k)
        }
      }

      return { allowed: true, remaining: max - 1 }
    }

    entry.count += 1
    if (entry.count > max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - entry.first)) / 1000)),
      }
    }
    return { allowed: true, remaining: max - entry.count }
  }
}

/**
 * Read the three required env vars. Accepts a plain object so it works with
 * both `process.env` (serverless) and Vite's `loadEnv` result (dev).
 */
export function readAiConfig(env) {
  const endpoint = (env.VITE_AI_ENDPOINT || '').trim()
  const apiKey = (env.AI_API_KEY || '').trim()
  const model = (env.VITE_AI_MODEL || '').trim()

  const missing = []
  if (!endpoint) missing.push('VITE_AI_ENDPOINT')
  if (!apiKey) missing.push('AI_API_KEY')
  if (!model) missing.push('VITE_AI_MODEL')

  return { endpoint, apiKey, model, missing }
}

/**
 * Core request handler shared by dev and production.
 *
 * Returns `{ status, body }` instead of touching req/res so each transport can
 * wire it up in its own idiom.
 */
export async function handleChat({ messages, env, checkRateLimit, clientKey }) {
  if (checkRateLimit && clientKey) {
    const verdict = checkRateLimit(clientKey)
    if (!verdict.allowed) {
      return {
        status: 429,
        headers: { 'Retry-After': String(verdict.retryAfterSec) },
        body: { error: 'Too many messages. Please wait a moment and try again.' },
      }
    }
  }

  const { endpoint, apiKey, model, missing } = readAiConfig(env)
  if (missing.length) {
    return {
      status: 503,
      body: {
        error: `AI assistant is not configured yet. Missing: ${missing.join(', ')}. Add them to the environment and restart.`,
      },
    }
  }

  const history = sanitizeMessages(messages)
  if (!history.length) {
    return { status: 400, body: { error: 'No messages supplied.' } }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIMITS.UPSTREAM_TIMEOUT_MS)

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...history],
        temperature: LIMITS.TEMPERATURE,
        max_tokens: LIMITS.MAX_OUTPUT_TOKENS,
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return {
        status: 502,
        body: { error: `AI upstream error (${upstream.status})`, detail: detail.slice(0, 500) },
      }
    }

    const data = await upstream.json()
    const reply = data?.choices?.[0]?.message?.content ?? ''
    if (typeof reply !== 'string' || !reply.trim()) {
      return { status: 502, body: { error: 'AI upstream returned an empty reply.' } }
    }

    return { status: 200, body: { reply } }
  } catch (err) {
    const aborted = err?.name === 'AbortError'
    return {
      status: aborted ? 504 : 500,
      body: {
        error: aborted
          ? 'The AI assistant took too long to respond. Please try again.'
          : 'Request to the AI assistant failed',
      },
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Derive a stable client identity from proxy headers. */
export function clientKeyFrom(headers = {}) {
  const fwd = headers['x-forwarded-for'] || headers['X-Forwarded-For']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return headers['x-real-ip'] || headers['X-Real-IP'] || 'anonymous'
}
