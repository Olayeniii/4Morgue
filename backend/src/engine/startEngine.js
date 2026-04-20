import { getEnv } from "../config.js"
import { fetchTokenTradeStats } from "../lib/dexScreener.js"
import { createTokenTracker } from "./stateMachine.js"
import { fetchFourMemeMeta, fetchRecentTokensFromFourmeme } from "../lib/fourmeme.js"
import { processDeath } from "./pipeline.js"

/**
 * @param {{ store: ReturnType<import('../lib/store.js').createStore>, broadcast: (o: object) => void, apiPublicUrl: string }} ctx
 */
export function startEngine(ctx) {
  const env = getEnv()
  const tracker = createTokenTracker({ maxTracked: env.maxTracked })
  const seen = new Set()
  /** @type {ReturnType<typeof setInterval>[]} */
  const timers = []

  // ── Poll Four.meme for new token launches ───────────────────────────────────
  async function pollCreations() {
    const tokens = await fetchRecentTokensFromFourmeme()
    console.log(`[engine] polled Four.meme — found ${tokens.length} tokens`)

    for (const { address, createdAt, name, symbol } of tokens) {
      const k = address.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)

      const createdAtMs = createdAt ? Date.parse(createdAt) : Date.now()
      console.log(`[engine] tracking: ${name} (${symbol}) — ${address.slice(0, 10)}…`)

      tracker.track({
        address,
        createdAtMs,
        name,
        symbol,
        creatorWallet: null,
      })

      // Fetch bonding curve + creator on first sight
      try {
        const meta = await fetchFourMemeMeta(address)
        if (meta?.bondingCurve != null) {
          tracker.applyMeta(address, { bondingCurvePercent: meta.bondingCurve })
          console.log(`[engine] ${address.slice(0, 10)}… curve: ${meta.bondingCurve}%`)
        }
        if (meta?.creator) {
          tracker.applyMeta(address, { creatorWallet: meta.creator })
        }
      } catch (e) {
        console.warn("[four.meme] metadata fetch failed:", address.slice(0, 10), e.message)
      }
    }

    console.log(`[engine] tracking ${tracker.size()} tokens total`)
  }

  // ── Tick: update stats + detect deaths ─────────────────────────────────────
  async function tick() {
    const now = Date.now()
    const tracking = tracker.listTracking()

    if (!tracking.length) return
    console.log(`[engine] tick — updating ${tracking.length} tracked token(s)`)

    // update trade stats + bonding curve for every tracked token
    for (const t of tracking) {
      // Update trade stats from DexScreener
      try {
        const stats = await fetchTokenTradeStats(t.address)
        tracker.applyTradeStats(t.address, stats)
      } catch (e) {
        console.warn("[engine] trade stats fetch failed:", t.address.slice(0, 10), e.message)
      }

      // Update bonding curve from Four.meme
      try {
        const meta = await fetchFourMemeMeta(t.address)
        if (meta?.bondingCurve != null) {
          tracker.applyMeta(t.address, { bondingCurvePercent: meta.bondingCurve })
        }
        if (meta?.creator && !t.creatorWallet) {
          tracker.applyMeta(t.address, { creatorWallet: meta.creator })
        }
      } catch {
        /* ignore — non-critical */
      }
    }

    const deaths = tracker.collectDeaths(now)

    if (!deaths.length) return
    console.log(`[engine] ${deaths.length} token(s) died this tick`)

    // Step 3: generate obituary + broadcast each death
    for (const { token, cause } of deaths) {
      console.log(`[engine] interring ${token.symbol} — cause: ${cause}`)
      try {
        await processDeath(token, cause, ctx)
      } catch (e) {
        console.warn("[engine] processDeath failed:", token.symbol, e.message)
      }
      // Remove from tracker regardless of processDeath success
      tracker.remove(token.address)
    }
  }

  // ── Timers ──────────────────────────────────────────────────────────────────
  timers.push(setInterval(() => void pollCreations().catch(console.error), env.pollMs))
  timers.push(setInterval(() => void tick().catch(console.error), env.tickMs))

  // Run immediately on startup
  void pollCreations().catch(console.error)

  console.log(`[engine] started — poll=${env.pollMs}ms tick=${env.tickMs}ms max=${env.maxTracked}`)
  console.log(`[engine] using Four.meme API for token discovery`)

  const hasAiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.MISTRAL_API_KEY
  if (!hasAiKey) {
    console.log(`[engine] no AI API key set — obituaries will use fallback templates`)
    console.log(`[engine] set GROQ_API_KEY, GEMINI_API_KEY, or MISTRAL_API_KEY for AI obituaries`)
  }

  return {
    tracker,
    stop: () => {
      timers.forEach(clearInterval)
      console.log("[engine] stopped")
    },
  }
}