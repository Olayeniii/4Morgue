/**
 * Dune Analytics integration for FourMorgue.
 * Seeds the graveyard with historical dead Four.meme tokens.
 */

import { DuneClient } from "@duneanalytics/client-sdk"

/**
 * Fetch historical Four.meme token data from Dune.
 * @param {string} duneApiKey
 * @param {number} limit
 * @returns {Promise<object[]>} raw Dune rows
 */

async function fetchBnbPrice() {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT"
    )
    const json = await res.json()
    const price = Number(json.price)
    if (price > 0) {
      console.log(`[dune] BNB price: $${price.toFixed(2)}`)
      return price
    }
  } catch (e) {
    console.warn("[dune] BNB price fetch failed:", e.message)
  }
  // Fallback chain
  return Number(process.env.BNB_USD_PRICE) || 580
}

export async function fetchDuneTokens(duneApiKey, limit = 200) {
  const queryId = Number(process.env.DUNE_QUERY_ID) || 7334839
  
  const dune = new DuneClient(duneApiKey)
  const query_result = await dune.getLatestResult({ queryId })
  
  if (!query_result?.result?.rows) {
    throw new Error(`Dune query ${queryId} returned no rows`)
  }
  
  // Limit results if needed
  return query_result.result.rows.slice(0, limit)
}

/**
 * Map a raw Dune row → FourMorgue DeathRecord shape.
 * Only tokens that did NOT graduate are dead — filter those.
 *
 * @param {object} row
 * @returns {object | null}
 */
export function duneRowToDeath(row) {
  const graduatedRaw = row.graduated

  const graduated = ["true", "1"].includes(
    String(graduatedRaw).toLowerCase().trim()
  ) || graduatedRaw === true || graduatedRaw === 1

  const token = row.morgue_id || row.token_address || row.token || row.contract_address
  if (!token) {
    console.log("[dune] skipping row - no address:", row)
    return null
  }

  // Map Dune column names to our schema
  const createdAt = row.born_at
    ? new Date(row.born_at).toISOString()
    : new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const diedAt = row.last_heartbeat
    ? new Date(row.last_heartbeat).toISOString()
    : new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString()

  const lifespanMinutes = row.lifespan_hrs 
    ? Math.round(row.lifespan_hrs * 60)
    : Math.max(1, Math.round((new Date(diedAt) - new Date(createdAt)) / 60000))

  const totalBuyers = Number(row.mourners || row.total_buyers || row.buyers || 0)
  const volumeUsd = Number(row.estate_value_usd || row.total_volume_usd || row.volume_usd || 0)
  const bondingCurve = Number(row.bonding_curve_pct || row.bonding_curve || 0)

  const peakMcapUSD = Number(row.peak_mcap_usd || volumeUsd * 3 || 0)

  // Parse cause from Dune's text field
  const duneCause = row.cause_of_death || ""
  const cause = mapDuneCause(duneCause, { totalBuyers, lifespanMinutes, bondingCurve, volumeUsd })

  // Extract name and symbol from "Name (SYMBOL)" format
  const nameMatch = row.deceased_name?.match(/^(.+?)\s*\((.+?)\)$/)
  const name = nameMatch ? nameMatch[1].trim() : row.deceased_name || row.name || "Unknown"
  const symbol = nameMatch ? nameMatch[2].trim() : row.symbol || "???"

  return {
    address: token,
    name,
    symbol,
    createdAt,
    diedAt,
    graduated,
    lifespanMinutes,
    peakMcapUSD: Math.round(peakMcapUSD),
    totalBuyers,
    totalTrades: Number(row.total_trades || totalBuyers * 2 || 0),
    creatorWallet: row.next_of_kin || row.creator || row.creator_wallet || "0x0000000000000000000000000000000000000000",
    causeOfDeath: cause,
    bondingCurveMax: Math.round(bondingCurve),
    obituary: "",
    epitaph: FALLBACK_EPITAPHS[cause],
    tone: CAUSE_TONES[cause],
    cardImageUrl: "",
  }
}

/**
 * Infer cause of death from available Dune metrics.
 * @param {{ totalBuyers: number, lifespanMinutes: number, bondingCurve: number, volumeUsd: number }} m
 * @returns {string}
 */
function inferCause({ totalBuyers, lifespanMinutes, bondingCurve, volumeUsd }) {
  if (lifespanMinutes <= 5 && totalBuyers >= 3) return "SPEED_RUG"
  if (totalBuyers <= 1) return "NEVER_LAUNCHED"
  if (bondingCurve >= 85 && bondingCurve < 100) return "STALLED_AT_90"
  if (lifespanMinutes <= 30 && volumeUsd > 0) return "DEV_DUMP"
  return "QUIET_FADE"
}

/**
 * Map Dune's text cause to our enum
 */
function mapDuneCause(duneText, metrics) {
  if (duneText.includes("Murdered by Dev")) return "DEV_DUMP"
  if (duneText.includes("Stillborn")) return "NEVER_LAUNCHED"
  if (duneText.includes("Abandoned")) return "QUIET_FADE"
  if (duneText.includes("Life Support")) return "QUIET_FADE"
  
  // Fallback to inference
  return inferCause(metrics)
}

const FALLBACK_EPITAPHS = {
  DEV_DUMP: "They said to the moon. They meant to my wallet.",
  QUIET_FADE: "It traded once, then the world forgot.",
  NEVER_LAUNCHED: "Born a token. Died a dream.",
  STALLED_AT_90: "So close. So, so close.",
  SPEED_RUG: "Here one minute. Literally.",
}

const CAUSE_TONES = {
  DEV_DUMP: "savage",
  QUIET_FADE: "eulogy",
  NEVER_LAUNCHED: "comic",
  STALLED_AT_90: "tragic",
  SPEED_RUG: "breaking",
}

/**
 * Seed the store with historical deaths from Dune.
 * Skips addresses already in the store (dedup by address).
 *
 * @param {ReturnType<import('./store.js').createStore>} store
 * @param {string} duneApiKey
 * @returns {Promise<number>} number of new deaths added
 */
export async function seedFromDune(store, duneApiKey) {
  console.log("[dune] seeding graveyard from historical data…")
  let added = 0
  try {
    const rows = await fetchDuneTokens(duneApiKey)
    console.log(`[dune] fetched ${rows.length} rows`)
    for (const row of rows) {
      const death = duneRowToDeath(row)
      if (!death) continue
      const inserted = store.addDeath(death)
      if (inserted) added++
    }
    console.log(`[dune] seeded ${added} historical deaths (${rows.length - added} skipped/graduated)`)
  } catch (e) {
    console.warn("[dune] seed failed:", e.message)
    console.warn("[dune] graveyard will use mock data only — check DUNE_API_KEY and DUNE_QUERY_ID")
  }
  return added
}









