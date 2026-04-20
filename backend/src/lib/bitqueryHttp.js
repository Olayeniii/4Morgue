import { FOURMEME_EXCHANGE } from "../config.js"

// BNB/USD price — rough constant, replace with oracle if needed
// As of April 2026 ~$580. Close enough for mcap estimates.
const BNB_USD = Number(process.env.BNB_USD_PRICE) || 580

/**
 * Fetch trade stats AND peak price for a token since launch.
 * @param {string} token
 * @param {string} bitqueryToken
 * @param {string} sinceIso
 */
export async function fetchTokenTradeStats(token, bitqueryToken, sinceIso) {
  // Skip if no token provided
  if (!bitqueryToken) {
    return { trades: 0, buyers: 0, peakPriceUsd: 0 }
  }

  const query = `
    {
      EVM(dataset: combined, network: bsc) {
        DEXTrades(
          where: {
            Trade: {
              Buy: {
                Currency: {
                  SmartContract: { is: "${token.toLowerCase()}" }
                }
              }
              Dex: {
                SmartContract: { is: "${FOURMEME_EXCHANGE}" }
              }
            }
          }
        ) {
          count
          uniq(of: Trade_Buyer)
          Trade {
            Buy {
              Price
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch(BITQUERY_HTTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bitqueryToken}`,
      },
      body: JSON.stringify({ query }),
    })

    // Log response for debugging
    const text = await res.text()
    
    if (!res.ok) {
      console.error(`[bitquery] HTTP ${res.status}: ${text.slice(0, 100)}`)
      return { trades: 0, buyers: 0 }
    }

    const json = JSON.parse(text)
    
    if (json.errors) {
      console.error("[bitquery] trade stats", json.errors[0]?.message || json.errors)
      return { trades: 0, buyers: 0 }
    }

    const data = json.data?.EVM?.DEXTrades?.[0]
    return {
      trades: data?.count || 0,
      buyers: data?.uniq || 0,
    }
  } catch (err) {
    console.error("[bitquery] trade stats error:", err.message)
    return { trades: 0, buyers: 0 }
  }
}

/**
 * Fetch peak market cap for a token.
 * Four.meme total supply is always 1,000,000,000 (1B tokens).
 * peakMcapUSD = peakPriceUsd * 1_000_000_000
 *
 * @param {string} token
 * @param {string} bitqueryToken
 * @param {string} sinceIso
 * @returns {Promise<number>} USD value
 */
export async function fetchPeakMcapUsd(token, bitqueryToken, sinceIso) {
  // Skip if no token provided
  if (!bitqueryToken) {
    return 0
  }

  const TOTAL_SUPPLY = 1_000_000_000

  try {
    const { peakPriceUsd } = await fetchTokenTradeStats(token, bitqueryToken, sinceIso)
    return Math.round(peakPriceUsd * TOTAL_SUPPLY)
  } catch (e) {
    console.warn("[bitquery] peak mcap", token.slice(0, 10), e.message)
    return 0
  }
}

const BITQUERY_HTTP = "https://streaming.bitquery.io/eap"

export async function fetchRecentTokenCreations(bitqueryToken, sinceIso) {
  // Skip if no token provided
  if (!bitqueryToken) {
    console.log('[bitquery] token not set — skipping creation polling')
    return []
  }

  const query = `
    {
      EVM(dataset: combined, network: bsc) {
        Events(
          limit: { count: 40 }
          orderBy: { descending: Block_Time }
          where: {
            Log: {
              SmartContract: { is: "${FOURMEME_EXCHANGE}" }
              Signature: { Name: { is: "TokenCreated" } }
            }
          }
        ) {
          Block {
            Time
          }
          Log {
            SmartContract
          }
          Arguments {
            Name
            Value {
              ... on EVM_ABI_Integer_Value_Arg {
                integer
              }
              ... on EVM_ABI_String_Value_Arg {
                string
              }
              ... on EVM_ABI_Address_Value_Arg {
                address
              }
              ... on EVM_ABI_BigInt_Value_Arg {
                bigInteger
              }
              ... on EVM_ABI_Bytes_Value_Arg {
                hex
              }
              ... on EVM_ABI_Boolean_Value_Arg {
                bool
              }
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch(BITQUERY_HTTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bitqueryToken}`,
      },
      body: JSON.stringify({ query }),
    })

    const json = await res.json()
    if (json.errors) {
      console.error("[bitquery] creations", json.errors[0]?.message || json.errors)
      return []
    }

    const events = json.data?.EVM?.Events || []
    const tokens = []

    for (const evt of events) {
      const time = evt.Block?.Time
      const args = evt.Arguments || []
      
      // Find token address in arguments
      const tokenArg = args.find(a => a.Name === "token" || a.Name === "tokenAddress")
      const address = tokenArg?.Value?.address
      
      if (address && time) {
        tokens.push({ address, createdAt: time })
      }
    }

    console.log(`[bitquery] found ${tokens.length} token creations`)
    return tokens
  } catch (err) {
    console.error("[bitquery] creations fetch error:", err.message)
    return []
  }
}
