/**
 * Best-effort metadata from Four.meme public API (see DATA.md).
 * Response shape may change — we only read common fields.
 *
 * @param {string} address
 * @returns {Promise<{ name?: string, symbol?: string, creator?: string, bondingCurve?: number } | null>}
 */
export async function fetchFourMemeMeta(address) {
  const a = address.toLowerCase()
  const urls = [
    `https://four.meme/meme-api/v1/public/token?address=${a}`,
    `https://four.meme/meme-api/v1/public/token/${a}`,
  ]
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } })
      if (!r.ok) continue
      const j = await r.json()
      const row = j?.data ?? j?.token ?? j
      if (!row && Array.isArray(j?.list)) {
        const found = j.list.find((t) => String(t?.address ?? t?.tokenAddress).toLowerCase() === a)
        if (found) return normalizeMeta(found)
      }
      if (row) return normalizeMeta(row)
    } catch {
      /* try next */
    }
  }
  return null
}

function normalizeMeta(row) {
  const bonding =
    row.bondingCurve ??
    row.bondingCurveProgress ??
    row.progress ??
    row.percent ??
    row.curvePercent
  return {
    name: row.name || row.tokenName,
    symbol: row.symbol || row.ticker,
    creator: row.creatorAddress || row.creator || row.devAddress,
    bondingCurve: typeof bonding === "number" ? Math.min(100, Math.max(0, bonding)) : undefined,
  }
}

async function fetchFromFillLast() {
  const res = await fetch("https://four.meme/meme-api/v1/public/fill/last?limit=100")
  const json = await res.json()
  
  if (json.code !== 0 || !json.data) return []
  
  const seen = new Set()
  const tokens = []
  
  for (const fill of json.data) {
    const address = fill.tokenAddress
    if (!address || seen.has(address.toLowerCase())) continue
    
    seen.add(address.toLowerCase())
    tokens.push({
      address,
      createdAt: fill.createTime || new Date().toISOString(),
      name: fill.tokenName,
      symbol: fill.tokenSymbol || fill.ticker || fill.tokenName?.slice(0, 6) || '???',
    })
  }
  
  console.log(`[fourmeme] extracted ${tokens.length} tokens from fill/last`)
  return tokens
}

export async function testFourmemeEndpoints() {
  const endpoints = [
    "https://four.meme/meme-api/v1/public/token/ranking?limit=10",
  ]
  
  for (const url of endpoints) {
    try {
      console.log(`\n[test] ${url}`)
      const res = await fetch(url)
      const data = await res.json()
      console.log("Full response:", JSON.stringify(data, null, 2))
    } catch (err) {
      console.log("Error:", err.message)
    }
  }
}

export async function fetchRecentTokensFromFourmeme() {
  try {
    const res = await fetch("https://four.meme/meme-api/v1/public/fill/last?limit=100")
    
    if (!res.ok) {
      console.error(`[fourmeme] fill/last HTTP ${res.status}`)
      return []
    }
    
    const json = await res.json()
    
    if (json.code !== 0 || !json.data) {
      console.error(`[fourmeme] unexpected response code: ${json.code}`)
      return []
    }
    
    const fills = Array.isArray(json.data) ? json.data : []
    const seen = new Set()
    const tokens = []
    
    for (const fill of fills) {
      const address = fill.tokenAddress
      if (!address || seen.has(address.toLowerCase())) continue
      
      seen.add(address.toLowerCase())
      tokens.push({
        address,
        createdAt: fill.createTime || new Date().toISOString(),
        name: fill.tokenName || 'Unknown',
        symbol: fill.tokenSymbol || fill.ticker || fill.tokenName?.slice(0, 6) || '???',
      })
    }
    
    console.log(`[fourmeme] extracted ${tokens.length} unique tokens from ${fills.length} trades`)
    return tokens
  } catch (err) {
    console.error("[fourmeme] error:", err.message)
    return []
  }
}

/**
 * Fetch recent trades for a specific token from Four.meme
 * @param {string} address
 * @returns {Promise<{ trades: number, buyers: number, lastTradeTime: string | null }>}
 */
export async function fetchFourMemeTradeStats(address) {
  try {
    const res = await fetch(`https://four.meme/meme-api/v1/public/fill/last?limit=100`)
    const json = await res.json()
    
    if (json.code !== 0 || !json.data) return { trades: 0, buyers: 0, lastTradeTime: null }
    
    const fills = json.data.filter(f => f.tokenAddress?.toLowerCase() === address.toLowerCase())
    const uniqueBuyers = new Set(fills.map(f => f.account)).size
    const lastTrade = fills.length > 0 ? fills[0].createTime : null
    
    return {
      trades: fills.length,
      buyers: uniqueBuyers,
      lastTradeTime: lastTrade
    }
  } catch (err) {
    console.error("[fourmeme] trade stats error:", err.message)
    return { trades: 0, buyers: 0, lastTradeTime: null }
  }
}
