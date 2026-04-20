import { MOCK_DEATHS } from "../data/mockDeaths.js"

function normalize(addr) {
  return String(addr).toLowerCase()
}

function stripInternal(row) {
  if (row == null) return row
  const { _source, ...rest } = row
  void _source
  return rest
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
    byAddress.set(normalize(d.token), { ...d, _source: "mock" })
  }

  return {
    /**
     * @param {object} record full DeathRecord
     * @returns {boolean} true if inserted (false if duplicate)
     */
    addDeath(record) {
      const k = normalize(record.token)
      if (byAddress.has(k)) return false
      byAddress.set(k, { ...record, _source: record._source || "live" })
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
        .sort((a, b) => new Date(b.diedAt) - new Date(a.diedAt))
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
