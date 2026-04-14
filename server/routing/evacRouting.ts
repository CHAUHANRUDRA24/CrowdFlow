/**
 * Congestion-Aware Evacuation Routing Engine
 * ==========================================
 * Uses a weighted Dijkstra's algorithm to recommend the safest,
 * least-congested evacuation path through a venue graph.
 *
 * Graph Nodes  → venue zones (gates, concourses, plazas)
 * Graph Edges  → corridors between zones, weighted by:
 *   - base travel time (seconds)
 *   - crowd density at the destination node
 *   - live gate flow percentage
 *
 * Edge weight formula:
 *   W(u→v) = baseCost * (1 + densityPenalty(v)) + waitTimePenalty(v)
 *   densityPenalty = congestionScore(v) / 50   (0 → 2x multiplier at 100%)
 *   waitTimePenalty = waitMinutes * 6           (expressed in seconds)
 *
 * @example
 *   const result = computeEvacRoute('sector-102', 'exit-north', liveData);
 *   // → { path: ['sector-102','concourse-b','gate-d','exit-north'],
 *   //     totalCostSeconds: 142, congestionScore: 0.34 }
 */

export interface VenueNode {
  id: string;
  label: string;
  /** 0-100 crowd density percentage */
  density: number;
  /** minutes wait time at this node */
  waitMinutes: number;
  /** whether this node is an exit */
  isExit?: boolean;
}

export interface VenueEdge {
  from: string;
  to: string;
  /** base travel time in seconds (bidirectional unless directed:true) */
  baseCostSeconds: number;
  directed?: boolean;
}

export interface RoutingResult {
  path: string[];
  pathLabels: string[];
  totalCostSeconds: number;
  /** normalised 0-1 score; lower = safer */
  congestionScore: number;
  recommendation: string;
}

// ── Default venue graph (mirrors the stadium in CommandCenter.tsx) ────────────

export const DEFAULT_NODES: VenueNode[] = [
  { id: "sector-101", label: "Sector 101 (South Stand)", density: 45, waitMinutes: 0 },
  { id: "sector-102", label: "Sector 102 (East Stand)", density: 78, waitMinutes: 2 },
  { id: "sector-103", label: "Sector 103 (North Stand)", density: 92, waitMinutes: 5 },
  { id: "concourse-a", label: "Concourse A (North)", density: 60, waitMinutes: 3 },
  { id: "concourse-b", label: "Concourse B (East)", density: 75, waitMinutes: 4 },
  { id: "concourse-c", label: "Concourse C (South)", density: 30, waitMinutes: 1 },
  { id: "south-plaza",  label: "South Plaza",          density: 32, waitMinutes: 1 },
  { id: "gate-a",      label: "Gate A (North Exit)",   density: 85, waitMinutes: 5, isExit: true },
  { id: "gate-b",      label: "Gate B (East Exit)",    density: 95, waitMinutes: 8, isExit: true },
  { id: "gate-c",      label: "Gate C (South Exit)",   density: 45, waitMinutes: 2, isExit: true },
  { id: "gate-d",      label: "Gate D (West Exit)",    density: 60, waitMinutes: 3, isExit: true },
];

export const DEFAULT_EDGES: VenueEdge[] = [
  { from: "sector-101", to: "concourse-c",  baseCostSeconds: 60  },
  { from: "sector-101", to: "concourse-b",  baseCostSeconds: 90  },
  { from: "sector-102", to: "concourse-b",  baseCostSeconds: 45  },
  { from: "sector-102", to: "concourse-a",  baseCostSeconds: 75  },
  { from: "sector-103", to: "concourse-a",  baseCostSeconds: 50  },
  { from: "concourse-a", to: "gate-a",      baseCostSeconds: 40  },
  { from: "concourse-a", to: "gate-d",      baseCostSeconds: 80  },
  { from: "concourse-b", to: "gate-b",      baseCostSeconds: 35  },
  { from: "concourse-b", to: "gate-d",      baseCostSeconds: 70  },
  { from: "concourse-c", to: "gate-c",      baseCostSeconds: 30  },
  { from: "concourse-c", to: "south-plaza", baseCostSeconds: 25  },
  { from: "south-plaza", to: "gate-c",      baseCostSeconds: 20  },
  { from: "south-plaza", to: "gate-d",      baseCostSeconds: 55  },
];

// ── Algorithm ─────────────────────────────────────────────────────────────────

function buildAdjacency(
  nodes: VenueNode[],
  edges: VenueEdge[]
): Map<string, { to: string; cost: number }[]> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, { to: string; cost: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach(({ from, to, baseCostSeconds, directed }) => {
    const dest = nodeMap.get(to);
    if (!dest) return;

    const densityPenalty = dest.density / 50; // 0 → 2x at 100%
    const waitPenalty    = dest.waitMinutes * 6; // minutes → seconds (at 10 m/min walk)
    const weight = baseCostSeconds * (1 + densityPenalty) + waitPenalty;

    adj.get(from)!.push({ to, cost: weight });
    if (!directed) {
      const srcNode = nodeMap.get(from);
      if (srcNode) {
        const srcDensityPenalty = srcNode.density / 50;
        const srcWaitPenalty    = srcNode.waitMinutes * 6;
        const reverseWeight = baseCostSeconds * (1 + srcDensityPenalty) + srcWaitPenalty;
        adj.get(to)!.push({ to: from, cost: reverseWeight });
      }
    }
  });

  return adj;
}

/**
 * Dijkstra shortest path between two node IDs.
 * Returns the ordered path and total weighted cost.
 */
function dijkstra(
  adj: Map<string, { to: string; cost: number }[]>,
  source: string,
  target: string
): { path: string[]; cost: number } | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  // Priority queue as sorted array (good enough for small venue graphs)
  const pq: { id: string; dist: number }[] = [];

  adj.forEach((_, nodeId) => {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
  });
  dist.set(source, 0);
  pq.push({ id: source, dist: 0 });

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === target) break;

    for (const { to: v, cost } of adj.get(u) || []) {
      if (visited.has(v)) continue;
      const alt = (dist.get(u) ?? Infinity) + cost;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
        pq.push({ id: v, dist: alt });
      }
    }
  }

  if ((dist.get(target) ?? Infinity) === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return { path, cost: dist.get(target)! };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute the safest evacuation route from a source zone to a named exit,
 * or to the best exit if no target is specified.
 */
export function computeEvacRoute(
  sourceId: string,
  targetId: string | null,
  nodes: VenueNode[]  = DEFAULT_NODES,
  edges: VenueEdge[]  = DEFAULT_EDGES
): RoutingResult | null {
  const adj      = buildAdjacency(nodes, edges);
  const nodeMap  = new Map(nodes.map((n) => [n.id, n]));
  const exits    = nodes.filter((n) => n.isExit).map((n) => n.id);

  const targets  = targetId ? [targetId] : exits;

  let best: { path: string[]; cost: number } | null = null;

  for (const exit of targets) {
    const result = dijkstra(adj, sourceId, exit);
    if (result && (!best || result.cost < best.cost)) {
      best = result;
    }
  }

  if (!best) return null;

  const pathLabels = best.path.map((id) => nodeMap.get(id)?.label ?? id);
  const avgDensity =
    best.path.reduce((sum, id) => sum + (nodeMap.get(id)?.density ?? 0), 0) /
    best.path.length;
  const congestionScore = +(avgDensity / 100).toFixed(2);

  const recommendation = generateRecommendation(best.path, nodeMap, congestionScore);

  return {
    path: best.path,
    pathLabels,
    totalCostSeconds: Math.round(best.cost),
    congestionScore,
    recommendation,
  };
}

/**
 * Recommend the least-congested exit gate for an evacuating crowd.
 */
export function recommendLeastCrowdedGate(
  nodes: VenueNode[] = DEFAULT_NODES
): VenueNode {
  const exits = nodes.filter((n) => n.isExit);
  return exits.reduce(
    (best, cur) =>
      cur.density + cur.waitMinutes * 5 < best.density + best.waitMinutes * 5
        ? cur
        : best,
    exits[0]
  );
}

/**
 * Compute a congestion score (0-100) for a zone, accounting for:
 * density, wait time, and velocity of crowd movement.
 */
export function computeCongestionScore(
  density: number,
  waitMinutes: number,
  velocity: number
): number {
  // velocity is crowd m/s; 0 = stopped (max danger), 1.4 = normal walk speed
  const velocityPenalty = Math.max(0, 1 - velocity / 1.4) * 20;
  const raw = density * 0.6 + waitMinutes * 2 + velocityPenalty;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function generateRecommendation(
  path: string[],
  nodeMap: Map<string, VenueNode>,
  congestionScore: number
): string {
  const exitNode = nodeMap.get(path[path.length - 1]);
  const label = exitNode?.label ?? "exit";
  if (congestionScore < 0.4) {
    return `Route via ${label} is clear. Estimated egress time: optimal.`;
  } else if (congestionScore < 0.7) {
    return `Moderate congestion on route to ${label}. Staff should assist at junction points.`;
  } else {
    return `High congestion on primary route. Consider ${label} as back-up — deploy crowd management units immediately.`;
  }
}
