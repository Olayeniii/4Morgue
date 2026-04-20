import { withPublicUrls } from "../lib/publicUrls.js"
import { pickEpitaph } from "./epitaphPool.js"

const TONE_BY_CAUSE = {
  DEV_DUMP:       "savage",
  QUIET_FADE:     "eulogy",
  NEVER_LAUNCHED: "comic",
  STALLED_AT_90:  "tragic",
  SPEED_RUG:      "savage",
}

/**
 * Process a token death.
 * - Picks epitaph instantly from pool (no API call)
 * - Leaves obituary blank — generated lazily when token page is viewed
 * - Broadcasts death to WebSocket clients immediately
 *
 * @param {object} token tracked token from the state machine
 * @param {string} cause CauseCode
 * @param {{ store, broadcast, apiPublicUrl: string }} ctx
 */
export async function processDeath(token, cause, ctx) {
  if (!token?.address) {
    console.warn("[pipeline] processDeath called with null/undefined token", { cause })
    return null
  }

  if (token.createdAtMs == null || Number.isNaN(token.createdAtMs)) {
    console.warn("[pipeline] token has invalid createdAtMs", {
      address: token.address,
      createdAtMs: token.createdAtMs,
    })
  }

  const diedAt = new Date()
  const createdAt =
    token.createdAtMs != null && !Number.isNaN(token.createdAtMs)
      ? new Date(token.createdAtMs)
      : new Date(diedAt.getTime() - 60_000)

  const lifespanMinutes = Math.max(
    1,
    Math.floor((diedAt.getTime() - createdAt.getTime()) / 60000)
  )

  const address = token.address.toLowerCase()

  // Epitaph: instant from pool, deterministic per address — no API call
  const epitaph = pickEpitaph(cause, address)
  const tone = TONE_BY_CAUSE[cause] || "eulogy"

  const record = {
    address,
    name:            token.name,
    symbol:          token.symbol,
    createdAt:       createdAt.toISOString(),
    diedAt:          diedAt.toISOString(),
    lifespanMinutes,
    peakMcapUSD:     Math.round(token.peakMcapUSD || 0),
    peakMcapCurrency:"USD",
    totalBuyers:     token.totalBuyers || 0,
    totalTrades:     token.totalTrades || 0,
    creatorWallet:   token.creatorWallet || null,
    causeOfDeath:    cause,
    bondingCurveMax: Math.round(token.bondingCurveMax || 0),
    epitaph,
    tone,
    // Obituary intentionally blank — generated lazily via GET /api/deaths/:address
    // when a user actually views the token. Zero AI cost at death time.
    obituary:        "",
    tokenImageUrl:   token.tokenImageUrl || "",
    cardImageUrl:    "",
  }

  const added = ctx.store.addDeath(record)
  if (!added) {
    console.warn("[pipeline] duplicate death skipped:", token.symbol)
    return null
  }

  // Use record directly — avoids null from address casing mismatch on store.get
  const [withUrl] = withPublicUrls([record], ctx.apiPublicUrl)
  ctx.broadcast({ type: "new_death", token: withUrl })
  console.log(`[pipeline] ⚰ ${token.symbol} (${cause}) ${lifespanMinutes}m — "${epitaph}"`)
  return withUrl
}
