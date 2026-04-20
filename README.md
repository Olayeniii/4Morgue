# FourMorgue

> *"Where memecoins go to die."*

FourMorgue is an AI-powered memorial platform for dead Four.meme tokens. It watches the BNB Chain in real-time, detects when memecoins die, generates darkly humorous AI obituaries tuned to the cause of death, and renders shareable cards — creating a living graveyard of every token that didn't make it.

Built for the **Four.meme AI Sprint Hackathon** (April 2026) — $50,000 prize pool.

---

## Quick start (local)

```bash
npm install --prefix backend && npm install --prefix frontend
# Terminal 1
npm run dev --prefix backend
# Terminal 2
npm run dev --prefix frontend
```

Or from the repo root (after `npm install` to get `concurrently`): `npm run dev` — API on [http://localhost:3001](http://localhost:3001), app on [http://localhost:5173](http://localhost:5173). Copy `frontend/.env.example` → `frontend/.env` if you need custom URLs.

The API ships with **mock graveyard data** so the UI works before Bitquery / Claude are wired up.

---

## What It Does

1. **Live Feed** — Tokens dying on Four.meme in real-time, each with an AI-generated obituary
2. **Graveyard** — Searchable historical archive of all dead tokens, filterable by cause of death
3. **Obituary Cards** — Shareable image cards: token name, lifespan, peak mcap, cause of death, AI epitaph
4. **Cause of Death Engine** — Classifies each death: Dev Dump, Quiet Fade, Never Launched, Stalled at 90%, Speed Rug

---

## Docs Structure

```
docs/
├── README.md              ← You are here
├── ARCHITECTURE.md        ← Full system design & data flow
├── DATA.md                ← API sources, queries, schema
├── OBITUARY_ENGINE.md     ← Death detection + AI prompt strategy
├── FRONTEND.md            ← UI components, design system, card renderer
└── DEPLOYMENT.md          ← Setup, env vars, build & deploy
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Live on-chain data | Bitquery GraphQL API (WebSocket) |
| Historical data | Dune Analytics API |
| AI obituary generation | Claude API (claude-sonnet-4-6) |
| Card rendering | HTML Canvas / html2canvas |
| Frontend | React + Tailwind |
| Backend | Node.js + Express |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Hackathon Submission Checklist

- [ ] GitHub repo (public, clean commits)
- [ ] Demo video (2–3 min, show live feed + card share)
- [ ] Deployed live URL
- [ ] DoraHacks BUIDL submission form filled
- [ ] Description emphasizes: AI + BNB Chain + Four.meme integration
