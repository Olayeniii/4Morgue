import { pickEpitaph } from "../engine/epitaphPool.js"

const DUNE_BASE_URL = "https://api.dune.com/api/v1"

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchDuneTokens(duneApiKey, limit = 200) {
  const queryId = Number(process.env.DUNE_QUERY_ID) || 7334839
  const MAX_CACHE_AGE_MS = 15 * 60 * 1000

  if (!duneApiKey) throw new Error("Missing DUNE_API_KEY")

  let fallbackRows = []

  // 1. Try cached results first
  const cachedRes = await fetch(
    `${DUNE_BASE_URL}/query/${queryId}/results?limit=${limit}`,
    {
      headers: { "X-DUNE-API-KEY": duneApiKey },
    }
  )

  if (cachedRes.ok) {
    const cachedJson = await cachedRes.json()

    const rows = cachedJson?.result?.rows

    if (Array.isArray(rows)) {
      fallbackRows = rows

      const executionEndedAt =
        cachedJson?.result?.execution_ended_at ||
        cachedJson?.execution_ended_at ||
        cachedJson?.result?.metadata?.execution_ended_at

      if (executionEndedAt) {
        const age =
          Date.now() - new Date(executionEndedAt).getTime()

        const isFresh = age <= MAX_CACHE_AGE_MS

        if (isFresh && rows.length > 0) {
          console.log(
            `[dune] using cached rows (${rows.length})`
          )
          return rows.slice(0, limit)
        }
      }
    }
  }

  console.log("[dune] cache stale → executing fresh query")

  // 2. Execute fresh query
  const execRes = await fetch(
    `${DUNE_BASE_URL}/query/${queryId}/execute`,
    {
      method: "POST",
      headers: {
        "X-DUNE-API-KEY": duneApiKey,
        "Content-Type": "application/json",
      },
    }
  )

  if (!execRes.ok) {
    console.warn("[dune] execute failed → using cache")
    return fallbackRows.slice(0, limit)
  }

  const execData = await execRes.json()
  const executionId = execData?.execution_id

  if (!executionId) {
    console.warn("[dune] no execution_id → using cache")
    return fallbackRows.slice(0, limit)
  }

  // 3. Poll execution status
  let finished = false

  for (let i = 0; i < 10; i++) {
    const statusRes = await fetch(
      `${DUNE_BASE_URL}/execution/${executionId}/status`,
      {
        headers: { "X-DUNE-API-KEY": duneApiKey },
      }
    )

    if (!statusRes.ok) break

    const status = await statusRes.json()

    if (status.is_execution_finished) {
      finished = true
      break
    }

    if (status.state === "QUERY_STATE_FAILED") {
      console.warn("[dune] execution failed → cache fallback")
      return fallbackRows.slice(0, limit)
    }

    await sleep(1500)
  }

  if (!finished) {
    console.warn("[dune] execution timeout → cache fallback")
    return fallbackRows.slice(0, limit)
  }

  // 4. Get fresh results
  const resultRes = await fetch(
    `${DUNE_BASE_URL}/execution/${executionId}/results?limit=${limit}`,
    {
      headers: { "X-DUNE-API-KEY": duneApiKey },
    }
  )

  if (resultRes.ok) {
    const freshJson = await resultRes.json()
    const freshRows = freshJson?.result?.rows

    if (Array.isArray(freshRows)) {
      console.log(
        `[dune] fresh rows (${freshRows.length})`
      )
      return freshRows.slice(0, limit)
    }
  }

  console.warn("[dune] fallback to cached rows")
  return fallbackRows.slice(0, limit)
}

/**
 * Cause tones
 */
const CAUSE_TONES = {
  DEV_DUMP: "savage",
  QUIET_FADE: "eulogy",
  NEVER_LAUNCHED: "comic",
  STALLED_AT_90: "tragic",
  SPEED_RUG: "breaking",
}

/**
 * Row mapping
 */
export function duneRowToDeath(row) {
  const token =
    row.morgue_id ||
    row.token_address ||
    row.token ||
    row.contract_address

  if (!token) return null

  const createdAtRaw = row.created_at || row.born_at
  const diedAtRaw =
    row.died_at || row.last_trade_at || row.last_heartbeat

  const createdAt = createdAtRaw
    ? new Date(createdAtRaw).toISOString()
    : new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const diedAt = diedAtRaw
    ? new Date(diedAtRaw).toISOString()
    : new Date().toISOString()

  const lifespanMinutes = Math.max(
    1,
    Math.round((new Date(diedAt) - new Date(createdAt)) / 60000)
  )

  // --------------------

  const totalBuyersRaw =
    row.total_buyers ?? row.mourners ?? row.buyers ?? null

  const totalTradesRaw =
    row.total_trades ?? row.txs ?? row.transactions ?? null

  const volumeBnbRaw =
    row.total_volume_bnb ?? null

  const volumeUsdRaw =
    row.total_volume_usd ?? row.volume_usd ?? null

  const bondingCurveRaw =
    row.bonding_curve_pct ?? null

    const peakMcapRaw =
    row.marketcap_bnb ??
    row.peak_mcap_bnb ??
    row.peak_mcap_usd ??
    null

  // convert safely
  const num = (v) =>
    v === null || v === undefined || v === "" ? null : Number(v)

  const totalBuyers = num(totalBuyersRaw)
  const totalTrades = num(totalTradesRaw)
  const volumeBnb = num(volumeBnbRaw)
  const volumeUsd = num(volumeUsdRaw)
  const bondingCurve = num(bondingCurveRaw)

  const peakMcapValue = num(peakMcapRaw)

  // infer currency from which column was used
  const peakMcapCurrency =
    row.marketcap_bnb != null || row.peak_mcap_bnb != null
      ? "BNB"
      : "USD"

const duneCause = row.cause_of_death || ""

 //detect weak rows
  const isStaleProxy =
  !row.total_volume_bnb &&
  !row.peak_mcap_usd &&
  !row.total_trades

//adjust metrics
const adjustedMetrics = {
  totalBuyers,
  lifespanMinutes,
  bondingCurve,
  volumeUsd: isStaleProxy ? volumeUsd * 0.5 : volumeUsd,
}



  // ---------- CAUSE ----------

  const cause = mapDuneCause(duneCause, adjustedMetrics)

  function softenCause(cause, row) {
    const weak =
      !row.total_trades || row.total_trades < 3
  
    if (!weak) return cause
  
    const pool = ["QUIET_FADE", "DEV_DUMP", "NEVER_LAUNCHED"]
  
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const finalCause = softenCause(cause, row)

  // ---------- NAME + SYMBOL ----------

  const nameMatch = row.deceased_name?.match(/^(.+?)\s*\((.+?)\)$/)

  const name =
    nameMatch?.[1]?.trim() ||
    row.deceased_name ||
    row.name ||
    "Unknown"

  const symbol =
    nameMatch?.[2]?.trim() ||
    row.symbol ||
    "???"


  //--------Creator Wallet--------
  const creatorWallet =
  row.creator ??
  row.creator_wallet ??
  row.next_of_kin ??
  null;  

  // ---------- FINAL RETURN ----------

  return {
    address: token,
    name,
    symbol,
    createdAt,
    diedAt,
    lifespanMinutes,
    totalBuyers,
    totalTrades,
    peakMcapUSD: peakMcapValue,
    peakMcapCurrency,
    creatorWallet,
    bondingCurveMax:
      bondingCurve !== null ? Math.round(bondingCurve) : null,
      causeOfDeath: finalCause,
    obituary: "",
    epitaph: pickEpitaph(cause, token),
    tone: CAUSE_TONES[cause] || "eulogy",
  }
}

/**
 * Cause inference
 */
function inferCause({ totalBuyers, lifespanMinutes, bondingCurve, volumeUsd }) {
  const strongData =
    totalBuyers != null &&
    lifespanMinutes != null &&
    volumeUsd != null

  if (lifespanMinutes <= 5 && totalBuyers >= 3) {
    return "SPEED_RUG"
  }

  // soften NEVER_LAUNCHED so it is not default-heavy
  if (totalBuyers === 0 && lifespanMinutes <= 10) {
    if (!strongData) return "QUIET_FADE"
    return "NEVER_LAUNCHED"
  }

  if (bondingCurve >= 85) return "STALLED_AT_90"

  if (lifespanMinutes <= 30 && volumeUsd > 0) {
    return "DEV_DUMP"
  }

  return "QUIET_FADE"
}

/**
 * Cause mapper
 */
function mapDuneCause(duneText, metrics) {
  const normalized = String(duneText || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")

  if (normalized === "DEV_DUMP") return "DEV_DUMP"
  if (normalized === "NEVER_LAUNCHED") return "NEVER_LAUNCHED"
  if (normalized === "QUIET_FADE") return "QUIET_FADE"
  if (normalized === "STALLED_AT_90") return "STALLED_AT_90"
  if (normalized === "SPEED_RUG") return "SPEED_RUG"

  return inferCause(metrics)
}

/**
 * Seeder
 */
export async function seedFromDune(store, duneApiKey) {
  console.log("[dune] seeding graveyard...")

  try {
    const rows = await fetchDuneTokens(duneApiKey)
    let added = 0

    for (const row of rows) {
      const death = duneRowToDeath(row)
      if (!death) continue

      const existing = store.get(death.address)

      if (existing) {
        store.updateDeath(death.address, death)
      } else {
        store.addDeath(death)
        added++
      }
    }

    console.log(`[dune] seeded ${added} records`)
  } catch (e) {
    console.warn("[dune] seed failed:", e.message)
  }
}