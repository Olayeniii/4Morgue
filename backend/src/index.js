import dotenv from "dotenv"
dotenv.config() // Load environment variables from .env file  
import http from "http"
import express from "express"
import cors from "cors"
import { WebSocketServer } from "ws"
import { createStore } from "./lib/store.js"
import { createRouter } from "./api/routes.js"
import { withPublicUrls } from "./lib/publicUrls.js"
import { startEngine } from "./engine/startEngine.js"
import { seedFromDune } from "./lib/dune.js"

const store = createStore()
/** @type {Set<import('ws').WebSocket>} */
const clients = new Set()

function broadcast(obj) {
  const data = JSON.stringify(obj)
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(data)
  }
}

const PORT = Number(process.env.PORT) || 3001
const API_PUBLIC =
  process.env.API_PUBLIC_URL?.replace(/\/$/, "") || `http://localhost:${PORT}`

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const ctx = { store, broadcast, apiPublicUrl: API_PUBLIC }
const engine = startEngine(ctx)
ctx.tracker = engine.tracker

app.use("/api", createRouter(ctx))

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    deaths: store.count(),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    dune: Boolean(process.env.DUNE_API_KEY),
    fourmeme: true, // Always available (public API)
    trackedTokens:
      typeof engine.tracker?.size === "function" ? engine.tracker.size() : 0,
  })
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: "/ws/deaths" })

wss.on("connection", (ws) => {
  clients.add(ws)
  const items = withPublicUrls(store.live(50), API_PUBLIC)
  ws.send(JSON.stringify({ type: "snapshot", count: store.count(), items }))
  ws.on("close", () => clients.delete(ws))
})

// ── WebSocket death simulator (dev only) ──────────────────────────────────────
const simMs = Number(process.env.WS_SIM_DEATH_MS || 0)
if (simMs > 0) {
  const all = store.all()
  let i = 0
  setInterval(() => {
    const token = all[i % all.length]
    i += 1
    broadcast({ type: "new_death", token: withPublicUrls([token], API_PUBLIC)[0] })
  }, simMs)
}

// ── Dune historical seeding ───────────────────────────────────────────────────
const DUNE_REFRESH_MS = Number(process.env.DUNE_REFRESH_MS) || 5 * 60 * 1000 // 5 min

async function refreshDune() {
  if (!process.env.DUNE_API_KEY) return
  await seedFromDune(store, process.env.DUNE_API_KEY)
}

server.listen(PORT, async () => {
  console.log(`FourMorgue API  http://localhost:${PORT}`)
  console.log(`WebSocket       ws://localhost:${PORT}/ws/deaths`)
  if (simMs) console.log(`WS simulator    every ${simMs}ms`)

  // Seed immediately on startup
  await refreshDune()

  // Then refresh on a cron
  if (process.env.DUNE_API_KEY) {
    setInterval(() => void refreshDune().catch(console.error), DUNE_REFRESH_MS)
    console.log(`[dune] cron refresh every ${DUNE_REFRESH_MS / 1000}s`)
  }
})

