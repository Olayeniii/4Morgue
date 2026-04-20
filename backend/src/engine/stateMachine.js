import { DEATH_RULES } from "./rules.js"
import { classifyCause } from "./classifier.js"

/**
 * @typedef {'TRACKING'|'DEAD'} TokenState
 * @typedef {'DEV_DUMP'|'QUIET_FADE'|'NEVER_LAUNCHED'|'STALLED_AT_90'|'SPEED_RUG'} CauseCode
 */

/**
 * @typedef {Object} TrackedToken
 * @property {string} address
 * @property {string} name
 * @property {string} symbol
 * @property {string} creatorWallet
 * @property {number} createdAtMs
 * @property {TokenState} state
 * @property {number | null} lastTradeAtMs
 * @property {number} totalTrades
 * @property {number} totalBuyers
 * @property {Set<string>} buyerSample
 * @property {number} peakMcapUSD
 * @property {number} bondingCurveMax
 * @property {string} tokenImageUrl
 * @property {number | null} firstReachedHighBondingAtMs
 * @property {number} creatorSellPercentGuess
 * @property {number} priceDropPercentGuess
 */

/**
 * @typedef {Object} TokenMetrics
 * @property {number} lifespanMinutes
 * @property {number} minutesSinceLastTrade
 * @property {number} totalBuyers
 * @property {number} totalTrades
 * @property {number} bondingCurveMax
 * @property {number} stalledNearGraduationMinutes
 * @property {number} creatorSellPercentGuess
 * @property {number} priceDropPercentGuess
 */

export function createTokenTracker({ maxTracked = 80 } = {}) {
  /** @type {Map<string, TrackedToken>} */
  const tokens = new Map()

  function key(addr) {
    return String(addr).toLowerCase()
  }

  /**
   * @param {{ address: string, createdAtMs?: number, name?: string, symbol?: string, creatorWallet?: string }} p
   */
  function track(p) {
    const k = key(p.address)
    if (tokens.has(k)) return tokens.get(k)
    if (tokens.size >= maxTracked) {
      const oldest = [...tokens.values()].sort((a, b) => a.createdAtMs - b.createdAtMs)[0]
      if (oldest) tokens.delete(key(oldest.address))
    }
    const t = {
      address: p.address,
      name: p.name || "Unknown",
      symbol: p.symbol || "???",
      creatorWallet: p.creatorWallet || "0x0000000000000000000000000000000000000000",
      createdAtMs: p.createdAtMs || Date.now(),
      state: "TRACKING",
      lastTradeAtMs: null,
      totalTrades: 0,
      totalBuyers: 0,
      buyerSample: new Set(),
      peakMcapUSD: 0,
      bondingCurveMax: 0,
      tokenImageUrl: "",
      firstReachedHighBondingAtMs: null,
      creatorSellPercentGuess: 0,
      priceDropPercentGuess: 0,
    }
    tokens.set(k, t)
    return t
  }

  /**
   * @param {string} address
   * @param {{ trades?: number, buyers?: number, volumeUsd?: number, lastTradeAtMs?: number, imageUrl?: string }} stats
   */
  function applyTradeStats(address, stats) {
    const t = tokens.get(key(address))
    if (!t || t.state === "DEAD") return
    const prevTrades = t.totalTrades  // 24h trades
    const prevBuyers = t.totalBuyers  // 24h buyers 
    if (typeof stats.trades === "number") t.totalTrades = Math.max(t.totalTrades, stats.trades)
    if (typeof stats.buyers === "number") {
      t.totalBuyers = Math.max(t.totalBuyers, stats.buyers)
    }
    if (typeof stats.volumeUsd === "number" && stats.volumeUsd > 0) {
      const mcap = stats.volumeUsd * 1_000_000_000
      t.peakMcapUSD = Math.max(t.peakMcapUSD, mcap)
    }
    if (typeof stats.lastTradeAtMs === "number" && stats.lastTradeAtMs > 0) {
      t.lastTradeAtMs = stats.lastTradeAtMs
    } else if (t.totalTrades > prevTrades || t.totalBuyers > prevBuyers) {
      t.lastTradeAtMs = Date.now()
    }
    if (stats.imageUrl && !t.tokenImageUrl) {
      t.tokenImageUrl = stats.imageUrl
    }
  }

  /**
   * @param {string} address
   * @param {{ bondingCurvePercent?: number, creatorWallet?: string, tokenImageUrl?: string }} meta
   */
  function applyMeta(address, meta) {
    const t = tokens.get(key(address))
    if (!t || t.state === "DEAD") return
    if (typeof meta.bondingCurvePercent === "number") {
      const b = meta.bondingCurvePercent
      t.bondingCurveMax = Math.max(t.bondingCurveMax, b)
      const rules = DEATH_RULES.STALLED_AT_90
      if (b >= rules.bondingCurveMin && b < 100) {
        if (t.firstReachedHighBondingAtMs == null) t.firstReachedHighBondingAtMs = Date.now()
      }
    }
    if (meta.creatorWallet) t.creatorWallet = meta.creatorWallet
    if (meta.tokenImageUrl && !t.tokenImageUrl) t.tokenImageUrl = meta.tokenImageUrl
  }

  /**
   * @param {TrackedToken} t
   * @param {number} nowMs
   * @returns {TokenMetrics}
   */
  function toMetrics(t, nowMs) {
    const lifespanMinutes = Math.max(0, (nowMs - t.createdAtMs) / 60000)
    const minutesSinceLastTrade = t.lastTradeAtMs
      ? Math.max(0, (nowMs - t.lastTradeAtMs) / 60000)
      : lifespanMinutes + 1000

    let stalledNearGraduationMinutes = 0
    if (
      t.firstReachedHighBondingAtMs != null &&
      t.bondingCurveMax >= DEATH_RULES.STALLED_AT_90.bondingCurveMin &&
      t.bondingCurveMax < 100
    ) {
      stalledNearGraduationMinutes = (nowMs - t.firstReachedHighBondingAtMs) / 60000
    }

    return {
      lifespanMinutes,
      minutesSinceLastTrade,
      totalBuyers: t.totalBuyers,
      totalTrades: t.totalTrades,
      bondingCurveMax: t.bondingCurveMax,
      stalledNearGraduationMinutes,
      creatorSellPercentGuess: t.creatorSellPercentGuess,
      priceDropPercentGuess: t.priceDropPercentGuess,
    }
  }

  /**
   * @param {TrackedToken} t
   * @param {number} nowMs
   */
  function shouldMarkDead(t, nowMs) {
    const ageMin = (nowMs - t.createdAtMs) / 60000
    const sinceTrade = t.lastTradeAtMs != null ? (nowMs - t.lastTradeAtMs) / 60000 : null
    const r = DEATH_RULES

    if (t.totalTrades === 0 && ageMin >= r.NEVER_LAUNCHED.noTradesMinutes) return true

    if (t.totalBuyers >= r.QUIET_FADE.minBuyers && sinceTrade != null && sinceTrade >= r.QUIET_FADE.noTradesMinutes) {
      return true
    }

    if (
      t.bondingCurveMax >= r.STALLED_AT_90.bondingCurveMin &&
      t.bondingCurveMax < r.STALLED_AT_90.bondingCurveMax &&
      t.firstReachedHighBondingAtMs != null &&
      (nowMs - t.firstReachedHighBondingAtMs) / 60000 >= r.STALLED_AT_90.stalledMinutes
    ) {
      return true
    }

    if (t.creatorSellPercentGuess >= r.DEV_DUMP.creatorSellPercent) return true

    if (
      ageMin <= r.SPEED_RUG.lifespanMinutes + 2 &&
      t.totalTrades >= 1 &&
      sinceTrade != null &&
      sinceTrade >= 1 &&
      ageMin >= 2
    ) {
      return true
    }

    return false
  }

  /**
   * @param {number} nowMs
   * @returns {{ token: TrackedToken, cause: CauseCode }[]}
   */
  function collectDeaths(nowMs) {
    const out = []
    for (const t of tokens.values()) {
      if (t.state !== "TRACKING") continue
      if (!shouldMarkDead(t, nowMs)) continue
      const metrics = toMetrics(t, nowMs)
      const cause = classifyCause(metrics)
      t.state = "DEAD"
      out.push({ token: t, cause })
    }
    return out
  }

  function remove(address) {
    tokens.delete(key(address))
  }

  function listTracking() {
    return [...tokens.values()].filter((t) => t.state === "TRACKING")
  }

  return {
    track,
    applyTradeStats,
    applyMeta,
    collectDeaths,
    remove,
    listTracking,
    toMetrics,
    size: () => tokens.size,
  }
}
