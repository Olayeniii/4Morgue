export function withPublicUrls(items, apiPublicUrl) {
  const base = apiPublicUrl.replace(/\/$/, "")
  return items.map((t) => ({
    ...t,
    cardImageUrl: `${base}/api/deaths/${encodeURIComponent(t.address)}/card`,
  }))
}
