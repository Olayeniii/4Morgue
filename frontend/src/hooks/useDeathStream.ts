import { useCallback, useEffect, useRef, useState } from "react"
import type { DeathRecord } from "../types/death"
import { fetchLive } from "../lib/api"
import { getWsUrl } from "../lib/ws"

export function useDeathStream() {
  const [items, setItems] = useState<DeathRecord[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<DeathRecord | null>(null)
  const seen = useRef(new Set<string>())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLive()
      setItems(data.items)
      setCount(data.count)
      seen.current = new Set(data.items.map((i) => i.address.toLowerCase()))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let ws: WebSocket | null = null
    let cancelled = false

    function connect() {
      if (cancelled) return
      ws = new WebSocket(getWsUrl())
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as
            | { type: "snapshot"; count: number; items: DeathRecord[] }
            | { type: "new_death"; token: DeathRecord }
          if (msg.type === "snapshot") {
            setCount(msg.count)
            setItems(msg.items)
            seen.current = new Set(msg.items.map((i) => i.address.toLowerCase()))
          }
          if (msg.type === "new_death") {
            const a = msg.token.address.toLowerCase()
            if (!seen.current.has(a)) {
              seen.current.add(a)
              setItems((prev) => [msg.token, ...prev].slice(0, 50))
              setCount((c) => c + 1)
            }
            setToast(msg.token)
            window.setTimeout(() => setToast(null), 4000)
          }
        } catch {
          /* ignore */
        }
      }
      ws.onclose = () => {
        if (!cancelled) window.setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      cancelled = true
      ws?.close()
    }
  }, [])

  return { items, count, loading, error, toast, reload: load }
}


