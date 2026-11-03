# Chebe — Parent Web Dashboard + Backend

Next.js (App Router) + Tailwind v4 + Leaflet + **Prisma + local Postgres + JWT auth**. Poll-only sync (no push infra).

## Backend setup (local Postgres)

```bash
cd webapp
cp .env.example .env        # edit DATABASE_URL + JWT_SECRET
createdb chebe               # if the DB doesn't exist yet
npx prisma migrate dev       # or: npm run db:push (no migration files)
npm run db:seed              # demo family: ama@example.com / password123
npm run dev
```

Open http://localhost:3000 → sign in with the seeded account (or register a new family).

## Routes (all PRD flows)

| Route | PRD | What it does |
|---|---|---|
| `/` | 4.2 Home | Family overview grid, master Instant Pause, alerts stream, screen time, weekly |
| `/routines` | 4.3 | Visual schedule builder (paint Bedtime/School/Homework), app limits, +15/+30 bonus |
| `/map` | 4.4 | Leaflet live map (OSM), child switcher, Home geofence radius 100–500m, SOS test |
| `/assistant` | 4.5 | Chat (5 intents: where-is, block, pause/resume, bedtime, summarize) + weekly + alerts |
| `/children` | 4.1 | Child profiles CRUD (mock) |
| `/pairing` | 4.1 | 6-digit pairing code generator + simulated child-device link |
| `/login` | 4.1 | Mock parent sign-in (any credentials → dashboard) |

## Mock layer

- `lib/mock.ts` — children, alerts, app inventory, weekly data
- `lib/store.tsx` — `ChebeProvider`: pause state, bonus, alerts, app limits, chat, toasts
- No backend calls yet. To wire Nest: replace `store.tsx` actions with `fetch` to `POST /commands/pause`, `PUT /policies/schedules`, `POST /assistant/chat`, plus a WebSocket client for live status/location/alerts.

## Notes

- Map uses OpenStreetMap tiles (no API key). Swap `TileLayer` URL for Mapbox/Google later.
- `npm run build` uses `--webpack` because `@next/swc-win32-x64-msvc` native binding is corrupt on this machine (Turbopack requires it; WASM fallback only supports webpack).
