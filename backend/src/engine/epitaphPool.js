/**
 * FourMorgue — Epitaph Pool
 * Pre-written epitaphs per cause of death.
 * Used at death time — zero API calls needed.
 * AI obituary is generated lazily only when a token page is viewed.
 */

const POOL = {
  DEV_DUMP: [
    "They said 'to the moon.' They meant 'to my wallet.'",
    "103 people believed. One didn't.",
    "The dev's exit was the only liquidity event that mattered.",
    "Built different. Left the same.",
    "Promises made at launch. Kept none of them.",
    "The whitepaper survived longer than the token.",
    "Rugged so fast the chart didn't have time to cry.",
    "Community token. Solo exit.",
    "They called it a project. It was a withdrawal plan.",
    "The only utility was the dev's retirement fund.",
    "Launched with vision. Left with BNB.",
    "The roadmap led straight to the creator's wallet.",
    "Fair launch. Unfair exit.",
    "Holders held. Dev didn't.",
    "It moonshot — straight into the dev's sell order.",
    "The community was the product. The dev was the customer.",
    "Tokenomics: 100% to charity, charity being the creator.",
    "They said diamond hands. They had paper everything.",
    "The only rug pull smoother than this was a magic trick.",
    "In memoriam: the wallets that trusted first.",
  ],

  QUIET_FADE: [
    "It traded once, then the world forgot.",
    "Not rugged. Just... unloved.",
    "The candles stopped burning. Nobody noticed.",
    "Volume: zero. Silence: absolute.",
    "It waited for buyers that never came.",
    "Faded, not rugged. Somehow sadder.",
    "The chart was a flatline before it was a chart.",
    "Eight believers held to the end. The end came quietly.",
    "It didn't crash. It simply stopped.",
    "No villain here. Just entropy with a ticker.",
    "Born into noise. Died in silence.",
    "The last trade was months ago. Nobody said goodbye.",
    "It peaked. Then it didn't.",
    "Some tokens go out with a bang. This one didn't go out at all.",
    "Liquidity thinned like fog at sunrise.",
    "It asked for attention. The chain looked away.",
    "Not every story has a villain. Some just end.",
    "The bonding curve was more of a bonding suggestion.",
    "Died as it lived — quietly, without drama.",
    "The mempool forgot it before the block confirmed.",
  ],

  NEVER_LAUNCHED: [
    "Born a token. Died a dream.",
    "One wallet. Zero trades. Infinite ambition.",
    "The launch party had no guests.",
    "It existed on-chain. Nowhere else.",
    "Created with hope. Ignored by everyone.",
    "The dev's cousin bought once. That was it.",
    "Technically a token. Practically nothing.",
    "The contract deployed. The buyers did not.",
    "Launched into the void. The void was unimpressed.",
    "Four.meme saw it. Nobody else did.",
    "A token so new it forgot to find buyers.",
    "It had a name, a symbol, and absolutely no takers.",
    "The bonding curve never curved.",
    "Existed for 15 minutes. Mattered for zero.",
    "The creator believed. The creator was alone.",
    "Not a rug pull. More of a rug absence.",
    "No volume. No buyers. No problem. No point.",
    "Born on a Tuesday. Dead by Tuesday.",
    "The chart was a horizontal line from birth.",
    "It launched. It landed immediately.",
  ],

  STALLED_AT_90: [
    "So close. So, so close.",
    "It waited at the gate for hours. Nobody let it in.",
    "92% of the way to forever. Stuck there.",
    "The finish line was visible. Unreachable.",
    "Almost graduated. The universe said no.",
    "It touched 90% and forgot how to move.",
    "PancakeSwap was right there. Right there.",
    "The bonding curve became a bonding straight line.",
    "It reached for graduation. The cap stayed on.",
    "So many buyers. Not quite enough.",
    "Greek tragedy, but with more slippage.",
    "The last 10% was a mountain nobody climbed.",
    "Stalled at the summit. Slid back down.",
    "It deserved to graduate. The market disagreed.",
    "A few thousand dollars away from surviving.",
    "The curve peaked and plateaued into legend.",
    "Close enough to see PancakeSwap. Not close enough to touch it.",
    "Held at 90% like a student who stopped studying.",
    "Almost is the saddest word in crypto.",
    "It had everything except the last push.",
  ],

  SPEED_RUG: [
    "Here one minute. Literally.",
    "Blink. Miss it. Lose money.",
    "The fastest rug in the West.",
    "Born and rugged before the chart loaded.",
    "Three minutes. Eighteen thousand dollars. Gone.",
    "Speed ran the entire token lifecycle.",
    "The dev didn't walk — they sprinted.",
    "If speedrunning had a hall of fame, this token would be banned.",
    "Launched. Rugged. Already forgotten.",
    "It existed in the time it takes to read this epitaph.",
    "BREAKING: Token dies mid-sentence.",
    "The liquidity evaporated before the buyers arrived.",
    "Record time. Wrong kind of record.",
    "From genesis to obituary in under five minutes.",
    "The rug was pre-installed at launch.",
    "A token so fast it lapped itself.",
    "They said 'wen launch?' It was already over.",
    "The life expectancy was shorter than the name.",
    "Rugged at speeds previously thought impossible.",
    "It came, it saw, it got rugged.",
  ],
}

/**
 * Pick a random epitaph for a given cause of death.
 * Deterministic if you pass the token address as seed —
 * same token always gets the same epitaph.
 *
 * @param {string} cause
 * @param {string} [seed] token address for deterministic pick
 * @returns {string}
 */
export function pickEpitaph(cause, seed = "") {
  const pool = POOL[cause] || POOL.QUIET_FADE
  // Deterministic pick based on address so epitaph doesn't change on refresh
  const index = seed
    ? Math.abs(hashStr(seed)) % pool.length
    : Math.floor(Math.random() * pool.length)
  return pool[index]
}

/** Simple djb2 hash for deterministic pool index */
function hashStr(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit int
  }
  return hash
}

/** Export pool sizes for health check */
export function getPoolStats() {
  return Object.fromEntries(
    Object.entries(POOL).map(([cause, arr]) => [cause, arr.length])
  )
}
