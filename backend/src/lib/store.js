import { MOCK_DEATHS } from "../data/mockDeaths.js"

function normalize(addr) {
  return String(addr).toLowerCase()
}

function getRecordAddress(record) {
  return record?.address || record?.token || null
}

function stripInternal(row) {
  if (row == null) return row
  const { _source, ...rest } = row
  void _source
  return rest
}

function asTime(value) {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function asNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function compareDeaths(a, b) {
  const diedDiff = asTime(b.diedAt) - asTime(a.diedAt)
  if (diedDiff !== 0) return diedDiff

  const bHasMcap = asNumber(b.peakMcapUSD) > 0 ? 1 : 0
  const aHasMcap = asNumber(a.peakMcapUSD) > 0 ? 1 : 0
  if (bHasMcap !== aHasMcap) return bHasMcap - aHasMcap

  const mcapDiff = asNumber(b.peakMcapUSD) - asNumber(a.peakMcapUSD)
  if (mcapDiff !== 0) return mcapDiff

  const tradesDiff = asNumber(b.totalTrades) - asNumber(a.totalTrades)
  if (tradesDiff !== 0) return tradesDiff

  const buyersDiff = asNumber(b.totalBuyers) - asNumber(a.totalBuyers)
  if (buyersDiff !== 0) return buyersDiff

  return asTime(b.createdAt) - asTime(a.createdAt)
}

/**
 
 */
function getInitialDeaths() {
  const hasLiveData =
    process.env.BITQUERY_TOKEN || process.env.DUNE_API_KEY
  if (hasLiveData) {
    console.log("[store] live mode — starting with empty store, awaiting real data")
    return []
  }
  console.log("[store] demo mode — seeding with mock data (set BITQUERY_TOKEN or DUNE_API_KEY for live data)")
  return MOCK_DEATHS
}

export function createStore() {
  /** @type {Map<string, object>} */
  const byAddress = new Map()

  for (const d of getInitialDeaths()) {
    const address = getRecordAddress(d)
    if (!address) continue
    byAddress.set(normalize(address), { ...d, _source: "mock" })
  }

  return {
    /**
     * @param {object} record full DeathRecord
     * @returns {boolean} true if inserted (false if duplicate)
     */
    addDeath(record) {
      const address = getRecordAddress(record)
      if (!address) {
        console.warn("[store] addDeath skipped record with no address")
        return false
      }
      const k = normalize(address)
      if (byAddress.has(k)) return false
      byAddress.set(k, {
        ...record,
        address: record.address || address,
        _source: record._source || "live",
      })
      return true
    },

    updateDeath(address, patch) {
      const k = normalize(address)
      const existing = byAddress.get(k)
      if (!existing) return false
      byAddress.set(k, { ...existing, ...patch })
      return true
    },


    all() {
      return [...byAddress.values()]
        .map(stripInternal)
        .sort(compareDeaths)
    },

    get(token) {
      return stripInternal(byAddress.get(normalize(token)) ?? null)
    },

    count() {
      return byAddress.size
    },

    live(limit = 20) {
      return this.all().slice(0, limit)
    },

    graveyard({ cursor = 0, limit = 20, q = "", cause = "" }) {
      let rows = this.all()
      const causes = cause
        ? cause.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
        : []
      if (causes.length) {
        rows = rows.filter((r) => causes.includes(r.causeOfDeath))
      }
      if (q) {
        const qq = q.toLowerCase()
        rows = rows.filter(
          (r) =>
            r.name.toLowerCase().includes(qq) ||
            r.symbol.toLowerCase().includes(qq) ||
            normalize(r.address).includes(qq)
        )
      }
      const start = Number(cursor) || 0
      const slice = rows.slice(start, start + limit)
      const nextCursor =
        start + slice.length < rows.length ? String(start + limit) : null
      return { items: slice, nextCursor, total: rows.length }
    },

    mortality() {
      const rows = this.all()
      const counts = {}
      for (const r of rows) {
        counts[r.causeOfDeath] = (counts[r.causeOfDeath] || 0) + 1
      }
      const total = rows.length || 1
      return Object.entries(counts).map(([cause, n]) => ({
        cause,
        count: n,
        percent: Math.round((n / total) * 1000) / 10,
      }))
    },

    /** Useful for health check — breakdown by source */
    sources() {
      const counts = { live: 0, dune: 0, mock: 0 }
      for (const r of byAddress.values()) {
        const s = r._source || "live"
        counts[s] = (counts[s] || 0) + 1
      }
      return counts
    },
  }
}
