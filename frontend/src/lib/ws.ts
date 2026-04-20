import { getApiBase } from "./api"

export function getWsUrl() {
  const env = import.meta.env.VITE_WS_URL
  if (env) return env
  const http = getApiBase()
  const u = new URL(http)
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
  u.pathname = "/ws/deaths"
  u.search = ""
  u.hash = ""
  return u.toString()
}
