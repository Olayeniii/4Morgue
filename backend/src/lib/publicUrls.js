export function withPublicUrls(items, apiPublicUrl) {
  const base = apiPublicUrl.replace(/\/$/, "")
  return items.map((t) => ({
    ...t,
    peakMcapCurrency: t.peakMcapCurrency || "USD",
    tokenImageUrl: t.tokenImageUrl || "",
    cardImageUrl: `${base}/api/deaths/${encodeURIComponent(t.address)}/card`,
  }))
}
