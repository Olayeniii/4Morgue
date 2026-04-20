/** Four.meme / BSC */
export const FOURMEME_EXCHANGE = "0x5c952063c7fc8610FFDB798152D69F0B9550762b"

//export const BITQUERY_HTTP = "https://graphql.bitquery.io"

export function getEnv() {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    pollMs: Number(process.env.BITQUERY_POLL_MS) || 45_000,
    tickMs: Number(process.env.ENGINE_TICK_MS) || 60_000,
    maxTracked: Number(process.env.MAX_TRACKED_TOKENS) || 80,
  }
}
