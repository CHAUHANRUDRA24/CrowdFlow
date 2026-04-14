# CrowdFlow AI — Architecture Decision Records

## ADR-001: Dijkstra's Algorithm for Evacuation Routing

**Date:** 2026-04-14  
**Status:** Accepted

### Context
Venue operators need real-time routing recommendations during emergencies that account for live crowd density, not just physical distance.

### Decision
Implemented a weighted Dijkstra's shortest-path algorithm in `server/routing/evacRouting.ts`.

**Edge weight formula:**
```
W(u→v) = baseCost × (1 + density_v/50) + waitMinutes_v × 6
```

- `baseCost` — physical travel time in seconds (corridor length / walk speed)
- `density_v` — crowd density at destination (0–100%), adds 0–2× multiplier
- `waitMinutes_v × 6` — converts queue time to seconds (6-second penalty per minute)

**Example:**
```
Sector 102 → Concourse B → Gate D
  Corridor 1: baseCost=45s, density=75% → W = 45×2.5 + 24 = 136.5s
  Corridor 2: baseCost=70s, density=60% → W = 70×2.2 + 18 = 172s
  Total: 308.5s vs Gate B (density 95%): 35×2.9 + 48 = 149.5s base, but high exit risk

Result: Gate D recommended despite longer corridor (safer crowd conditions)
```

### Alternatives Considered
- **A\*** — Requires spatial coordinates for heuristic; overkill for a venue graph with <20 nodes
- **BFS** — Ignores crowd density weighting entirely

---

## ADR-002: Firebase RTDB + Firestore Hybrid

**Status:** Accepted

- **Firestore** — Auth user records, audit logs, incident reports (structured, queryable)
- **RTDB** _(roadmap)_ — Live telemetry streaming at 1Hz push intervals (low latency, websocket-native)

---

## ADR-003: Gemini 2.5 Flash with Function Calling

**Status:** Accepted

Gemini's native function-calling capability allows the AI to trigger real venue actions (dispatch, broadcast, evacuate) instead of just generating text. The entire live telemetry JSON is injected into the system prompt on every request, making every AI response context-aware.

---

## ADR-004: Cloud Run Deployment

**Status:** Accepted

The unified Node.js server (serving both the API and the built Vite SPA) is containerized in `Dockerfile` and deployed to Cloud Run for:
- Automatic HTTPS
- Scale-to-zero (cost efficiency for event-driven workloads)
- Managed TLS + load balancing
