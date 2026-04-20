function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function wrapLines(text, maxLen = 52) {
  const words = String(text).split(/\s+/)
  const lines = []
  let cur = ""
  for (const w of words) {
    const next = (cur + " " + w).trim()
    if (next.length > maxLen && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 3)
}

export function buildCardSvg(token) {
  const name = esc(token.name)
  const sym = esc(token.symbol)
  const life = `${token.lifespanMinutes}m`
  const peak =
    token.peakMcapUSD >= 1_000_000
      ? `$${(token.peakMcapUSD / 1_000_000).toFixed(2)}M`
      : `$${Math.round(token.peakMcapUSD).toLocaleString()}`
  const buyers = String(token.totalBuyers)
  const lines = wrapLines(token.epitaph || "", 54)
  const epitaphSpans = lines
    .map((line, i) =>
      i === 0
        ? `<tspan x="36" y="278">${esc(line)}</tspan>`
        : `<tspan x="36" dy="18">${esc(line)}</tspan>`
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <rect width="600" height="380" fill="#09090b"/>
  <text x="24" y="36" fill="#e53935" font-family="ui-monospace, monospace" font-size="11">☠ FOURMORGUE</text>
  <text x="24" y="120" fill="#fafaf9" font-family="Georgia, serif" font-size="36" font-weight="700">${name}</text>
  <text x="24" y="148" fill="#a1a1aa" font-family="ui-monospace, monospace" font-size="12">${sym}</text>
  <line x1="24" y1="168" x2="576" y2="168" stroke="url(#g)" stroke-width="1"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(229,57,53,0.6)"/>
      <stop offset="100%" stop-color="rgba(229,57,53,0)"/>
    </linearGradient>
  </defs>
  <text x="24" y="210" fill="#d4d4d8" font-family="ui-monospace, monospace" font-size="14">Lifespan</text>
  <text x="24" y="232" fill="#fafaf9" font-family="ui-monospace, monospace" font-size="14">${life}</text>
  <text x="220" y="210" fill="#d4d4d8" font-family="ui-monospace, monospace" font-size="14">Peak mcap</text>
  <text x="220" y="232" fill="#fafaf9" font-family="ui-monospace, monospace" font-size="14">${peak}</text>
  <text x="400" y="210" fill="#d4d4d8" font-family="ui-monospace, monospace" font-size="14">Buyers</text>
  <text x="400" y="232" fill="#fafaf9" font-family="ui-monospace, monospace" font-size="14">${buyers}</text>
  <rect x="24" y="252" width="4" height="64" fill="#e53935" rx="1"/>
  <text fill="#e4e4e7" font-family="Georgia, serif" font-size="15" font-style="italic">${epitaphSpans}</text>
  <text x="24" y="364" fill="#52525b" font-family="ui-monospace, monospace" font-size="10">fourmorgue.xyz</text>
  <text x="576" y="364" fill="#52525b" font-family="ui-monospace, monospace" font-size="10" text-anchor="end">BNB Chain</text>
</svg>`
}
