import express from "express"
import { buildCardSvg } from "../lib/cardSvg.js"
import { withPublicUrls } from "../lib/publicUrls.js"
import { generateObituary } from "../engine/obituary.js"

/**
 * @param {{ store: ReturnType<import('../lib/store.js').createStore>, broadcast?: (msg: object) => void, apiPublicUrl: string, tracker?: { size(): number } }} ctx
 */
export function createRouter(ctx) {
  const r = express.Router()

  function baseUrl(req) {
    return ctx.apiPublicUrl || `${req.protocol}://${req.get("host")}`
  }

  // ── Live feed ───────────────────────────────────────────────────────────────
  r.get("/deaths/live", (req, res) => {
    const items = withPublicUrls(ctx.store.live(50), baseUrl(req))
    res.json({ count: ctx.store.count(), items })
  })

  // ── Graveyard (paginated) ───────────────────────────────────────────────────
  r.get("/deaths/graveyard", (req, res) => {
    const { cursor = "0", limit = "20", q = "", cause = "" } = req.query
    const result = ctx.store.graveyard({
      cursor: Number(cursor),
      limit: Math.min(Number(limit) || 20, 50),
      q: String(q),
      cause: String(cause),
    })
    res.json({
      items: withPublicUrls(result.items, baseUrl(req)),
      nextCursor: result.nextCursor,
      total: result.total,
    })
  })

  // ── Mortality distribution ──────────────────────────────────────────────────
  r.get("/deaths/stats/mortality", (_req, res) => {
    res.json({ distribution: ctx.store.mortality() })
  })

  // ── Status ──────────────────────────────────────────────────────────────────
  r.get("/status", (_req, res) => {
    const tr = ctx.tracker
    res.json({
      groq:    Boolean(process.env.GROQ_API_KEY),
      gemini:  Boolean(process.env.GEMINI_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
      trackedTokens: typeof tr?.size === "function" ? tr.size() : 0,
      deaths: ctx.store.count(),
    })
  })

  // ── Single token — lazy obituary generation ─────────────────────────────────
  // If obituary is blank (not yet generated), generate it now and cache it.
  // This means AI is only called when a human actually views a token.
  r.get("/deaths/:address", async (req, res) => {
    const token = ctx.store.get(req.params.address)
    if (!token) return res.status(404).json({ error: "Not found" })

    // Generate obituary on first view if blank
    if (!token.obituary) {
      try {
        console.log(`[routes] generating obituary on demand for ${token.symbol}`)
        const { obituary, epitaph, tone } = await generateObituary(token, token.causeOfDeath)

        // Patch the record in the store
        ctx.store.updateDeath(token.address, {
          obituary,
          // Only update epitaph if we got a better one from AI
          epitaph: epitaph || token.epitaph,
          tone,
        })

        // Re-fetch after update
        const updated = ctx.store.get(req.params.address)
        return res.json(withPublicUrls([updated], baseUrl(req))[0])
      } catch (e) {
        console.warn("[routes] lazy obituary generation failed:", e.message)
        // Return token with fallback epitaph — don't block the response
        return res.json(withPublicUrls([token], baseUrl(req))[0])
      }
    }

    res.json(withPublicUrls([token], baseUrl(req))[0])
  })

  // ── Card SVG ────────────────────────────────────────────────────────────────
  r.get("/deaths/:address/card", (req, res) => {
    const token = ctx.store.get(req.params.address)
    if (!token) return res.status(404).send("Not found")
    const svg = buildCardSvg(token)
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    res.send(svg)
  })

  return r
}
