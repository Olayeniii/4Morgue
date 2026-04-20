/**
 * FourMorgue — Obituary Generator with provider rotation
 *
 * Rotation order: Groq → Gemini → Mistral → fallback template
 */

import { GoogleGenAI } from "@google/genai"

// ── Fallbacks ──────────────────────────────────────────────────────────────────

const FALLBACK_EPITAPHS = {
  DEV_DUMP:       "They said 'to the moon.' They meant 'to my wallet.'",
  QUIET_FADE:     "It traded once, then the world forgot.",
  NEVER_LAUNCHED: "Born a token. Died a dream.",
  STALLED_AT_90:  "So close. So, so close.",
  SPEED_RUG:      "Here one minute. Literally.",
}

const TONE_BY_CAUSE = {
  DEV_DUMP:       "savage",
  QUIET_FADE:     "eulogy",
  NEVER_LAUNCHED: "comic",
  STALLED_AT_90:  "tragic",
  SPEED_RUG:      "savage",
}

// ── Prompt ─────────────────────────────────────────────────────────────────────

const SYSTEM = `You are the AI obituary writer for FourMorgue — a memorial site for dead memecoins on Four.meme (BNB Chain).

Write short, memorable obituaries for tokens that didn't make it.
Respond ONLY in this exact JSON format — no markdown, no backticks, no explanation:
{"obituary":"...","epitaph":"..."}

obituary: 3-5 sentences. Tone varies by cause (see user message).
epitaph: exactly 1 sentence, max 12 words. The gravestone inscription.

Rules:
- Reference actual on-chain facts (name, lifespan, buyers, peak mcap)
- Be specific, not generic
- Never use the word "unfortunately"
- Epitaph must be quotable and memorable`

function buildUserPrompt(t, cause) {
  const hints = {
    DEV_DUMP:       "Tone: savage Twitter roast. The dev is the villain.",
    QUIET_FADE:     "Tone: melancholic poet. Quiet end, no villain.",
    NEVER_LAUNCHED: "Tone: deadpan dark comedy. Almost nobody showed up.",
    STALLED_AT_90:  "Tone: Greek tragedy. Almost graduated.",
    SPEED_RUG:      "Tone: breathless breaking news parody.",
  }
  return `Token: ${t.name} (${t.symbol})
Cause of death: ${cause}
Lifespan: ${t.lifespanMinutes} minutes
Peak mcap: $${Math.round(t.peakMcapUSD || 0)}
Buyers: ${t.totalBuyers}
Trades: ${t.totalTrades}
Bonding curve max: ${Math.round(t.bondingCurveMax || 0)}%

${hints[cause] || hints.QUIET_FADE}

Write the JSON now.`
}

// ── Per-provider request budget (resets at midnight UTC) ──────────────────────

const budgets = {
  groq:    { limit: 14400, used: 0, resetAt: todayMidnightUtc() },
  gemini:  { limit: 1500,  used: 0, resetAt: todayMidnightUtc() },
  mistral: { limit: 30,    used: 0, resetAt: todayMidnightUtc() }, // ~1000/month ÷ 30 days
}

function todayMidnightUtc() {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.getTime()
}

function checkBudget(name) {
  const b = budgets[name]
  if (!b) return false
  if (Date.now() >= b.resetAt) {
    b.used = 0
    b.resetAt = todayMidnightUtc()
    console.log(`[obituary] ${name} budget reset`)
  }
  return b.used < b.limit
}

function consumeBudget(name) {
  if (budgets[name]) budgets[name].used++
}

// ── In-flight dedup guard ─────────────────────────────────────────────────────

/** @type {Map<string, Promise<{obituary:string,epitaph:string,tone:string}>>} */
const inFlight = new Map()

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {object} tokenLike
 * @param {string} cause
 * @returns {Promise<{ obituary: string, epitaph: string, tone: string }>}
 */
export async function generateObituary(tokenLike, cause) {
  const tone = TONE_BY_CAUSE[cause] || "eulogy"
  const addr = String(tokenLike.address).toLowerCase()

  // Dedup — if already generating for this token, reuse the promise
  if (inFlight.has(addr)) {
    console.log(`[obituary] dedup hit — ${tokenLike.symbol}`)
    return inFlight.get(addr)
  }

  const promise = _generate(tokenLike, cause, tone).finally(() => {
    inFlight.delete(addr)
  })

  inFlight.set(addr, promise)
  return promise
}

async function _generate(tokenLike, cause, tone) {
  const userPrompt = buildUserPrompt(tokenLike, cause)

  const providers = [
    { name: "groq",    fn: callGroq },
    { name: "gemini",  fn: callGemini },
    { name: "mistral", fn: callMistral },
  ]

  for (const { name, fn } of providers) {
    const apiKey = getKey(name)
    if (!apiKey) {
      console.log(`[obituary] ${name} — no API key, skipping`)
      continue
    }
    if (!checkBudget(name)) {
      console.log(`[obituary] ${name} — daily budget exhausted, trying next`)
      continue
    }

    try {
      console.log(`[obituary] trying ${name} for ${tokenLike.symbol}`)
      const result = await fn(apiKey, SYSTEM, userPrompt)
      if (result) {
        consumeBudget(name)
        console.log(`[obituary] ✓ ${name} — ${tokenLike.symbol} (${cause})`)
        return { ...result, tone }
      }
    } catch (e) {
      console.warn(`[obituary] ${name} error:`, e.message)
      // If rate limited, mark provider budget as exhausted for today
      if (e.message?.includes("429") || e.message?.toLowerCase().includes("rate")) {
        if (budgets[name]) budgets[name].used = budgets[name].limit
        console.warn(`[obituary] ${name} rate limited — marking exhausted for today`)
      }
    }
  }

  console.warn(`[obituary] all providers failed for ${tokenLike.symbol} — using fallback`)
  return fallback(tokenLike, cause, tone)
}

// ── Provider implementations ──────────────────────────────────────────────────

/** Groq */
async function callGroq(apiKey, system, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text().then(t => t.slice(0,100))}`)
  const json = await res.json()
  return parseAndClamp(json.choices?.[0]?.message?.content)
}

/** Gemini — gemini-2.0-flash */
async function callGemini(apiKey, system, userPrompt) {
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: `${system}\n\n${userPrompt}` }] }],
    config: {
      temperature: 0.9,
      maxOutputTokens: 300,
      responseMimeType: "application/json",
    },
  })
  return parseAndClamp(response.text)
}

/** Mistral */
async function callMistral(apiKey, system, userPrompt) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text().then(t => t.slice(0,100))}`)
  const json = await res.json()
  return parseAndClamp(json.choices?.[0]?.message?.content)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getKey(provider) {
  const keys = {
    groq:    process.env.GROQ_API_KEY    || "",
    gemini:  process.env.GEMINI_API_KEY  || "",
    mistral: process.env.MISTRAL_API_KEY || "",
  }
  return keys[provider] || ""
}

function parseAndClamp(raw) {
  if (!raw) return null
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const p = JSON.parse(m[0])
    if (!p?.obituary || !p?.epitaph) return null
    return {
      obituary: clamp(p.obituary, 500),
      epitaph:  clamp(p.epitaph, 80),
    }
  } catch {
    return null
  }
}

function clamp(s, n) {
  const t = String(s).trim()
  return t.length > n ? t.slice(0, n - 1) + "…" : t
}

function fallback(tokenLike, cause, tone) {
  return {
    obituary: `${tokenLike.name} (${tokenLike.symbol}) is no longer with us. Cause: ${cause.replace(/_/g, " ")}. It lived ${tokenLike.lifespanMinutes} minutes and reached roughly $${Math.round(tokenLike.peakMcapUSD || 0)} at its peak. The chain remembers.`,
    epitaph:  FALLBACK_EPITAPHS[cause] || "Gone but not forgotten.",
    tone,
  }
}

// ── Budget status (exposed for /health endpoint) ──────────────────────────────

export function getObituaryBudgetStatus() {
  return Object.fromEntries(
    Object.entries(budgets).map(([name, b]) => [
      name,
      { used: b.used, limit: b.limit, remaining: b.limit - b.used },
    ])
  )
}