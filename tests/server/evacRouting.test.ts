import { describe, it, expect } from "vitest";
import {
  computeEvacRoute,
  recommendLeastCrowdedGate,
  computeCongestionScore,
  DEFAULT_NODES,
  DEFAULT_EDGES,
  VenueNode,
  VenueEdge,
} from "../../server/routing/evacRouting";

// ── computeEvacRoute ─────────────────────────────────────────────────────────

describe("computeEvacRoute — Dijkstra's algorithm", () => {
  it("returns a valid route from sector-102 to any exit", () => {
    const result = computeEvacRoute("sector-102", null);
    expect(result).not.toBeNull();
    expect(result!.path.length).toBeGreaterThanOrEqual(2);
    expect(result!.totalCostSeconds).toBeGreaterThan(0);
  });

  it("always ends at an exit node", () => {
    const result = computeEvacRoute("sector-103", null);
    expect(result).not.toBeNull();
    const lastNode = DEFAULT_NODES.find(
      (n) => n.id === result!.path[result!.path.length - 1]
    );
    expect(lastNode?.isExit).toBe(true);
  });

  it("returns congestionScore between 0 and 1", () => {
    const result = computeEvacRoute("sector-101", null);
    expect(result!.congestionScore).toBeGreaterThanOrEqual(0);
    expect(result!.congestionScore).toBeLessThanOrEqual(1);
  });

  it("prefers low-density routes over high-density short routes", () => {
    // Gate C has density 45 (low), Gate B has density 95 (very high)
    // Starting from south-plaza — direct path to gate-c should win
    const result = computeEvacRoute("south-plaza", null);
    expect(result).not.toBeNull();
    expect(result!.path[result!.path.length - 1]).not.toBe("gate-b");
  });

  it("finds route to a specific named exit", () => {
    const result = computeEvacRoute("sector-101", "gate-c");
    expect(result).not.toBeNull();
    expect(result!.path[result!.path.length - 1]).toBe("gate-c");
  });

  it("returns null when source node does not exist", () => {
    const result = computeEvacRoute("nonexistent-node", null);
    expect(result).toBeNull();
  });

  it("generates a non-empty recommendation string", () => {
    const result = computeEvacRoute("sector-102", null);
    expect(typeof result!.recommendation).toBe("string");
    expect(result!.recommendation.length).toBeGreaterThan(10);
  });

  it("produces pathLabels matching path length", () => {
    const result = computeEvacRoute("sector-103", null);
    expect(result!.pathLabels.length).toBe(result!.path.length);
  });

  it("handles a custom minimal graph correctly", () => {
    const nodes: VenueNode[] = [
      { id: "a", label: "A", density: 10, waitMinutes: 0 },
      { id: "b", label: "B", density: 10, waitMinutes: 0, isExit: true },
    ];
    const edges: VenueEdge[] = [
      { from: "a", to: "b", baseCostSeconds: 30 },
    ];
    const result = computeEvacRoute("a", "b", nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(["a", "b"]);
  });

  it("returns null when no path exists between disconnected nodes", () => {
    const nodes: VenueNode[] = [
      { id: "island", label: "Island", density: 0, waitMinutes: 0 },
      { id: "exit", label: "Exit", density: 0, waitMinutes: 0, isExit: true },
    ];
    const result = computeEvacRoute("island", "exit", nodes, []); // no edges
    expect(result).toBeNull();
  });
});

// ── recommendLeastCrowdedGate ────────────────────────────────────────────────

describe("recommendLeastCrowdedGate", () => {
  it("returns an exit node", () => {
    const gate = recommendLeastCrowdedGate();
    expect(gate.isExit).toBe(true);
  });

  it("returns the gate with lowest composite score", () => {
    const nodes: VenueNode[] = [
      { id: "g1", label: "Gate 1", density: 90, waitMinutes: 10, isExit: true },
      { id: "g2", label: "Gate 2", density: 20, waitMinutes:  1, isExit: true },
      { id: "g3", label: "Gate 3", density: 50, waitMinutes:  5, isExit: true },
    ];
    const gate = recommendLeastCrowdedGate(nodes);
    expect(gate.id).toBe("g2");
  });

  it("handles a single-exit venue", () => {
    const nodes: VenueNode[] = [
      { id: "only-exit", label: "Only Exit", density: 60, waitMinutes: 2, isExit: true },
    ];
    const gate = recommendLeastCrowdedGate(nodes);
    expect(gate.id).toBe("only-exit");
  });
});

// ── computeCongestionScore ───────────────────────────────────────────────────

describe("computeCongestionScore", () => {
  it("returns 0 for an empty zone moving at full speed", () => {
    const score = computeCongestionScore(0, 0, 1.4);
    expect(score).toBe(0);
  });

  it("returns 100 (max) for fully packed, stationary zone", () => {
    const score = computeCongestionScore(100, 10, 0);
    expect(score).toBe(100);
  });

  it("increases as density increases", () => {
    const low  = computeCongestionScore(20, 0, 1.0);
    const high = computeCongestionScore(80, 0, 1.0);
    expect(high).toBeGreaterThan(low);
  });

  it("increases as wait time increases", () => {
    const fast = computeCongestionScore(50, 1, 1.0);
    const slow = computeCongestionScore(50, 8, 1.0);
    expect(slow).toBeGreaterThan(fast);
  });

  it("increases when velocity is 0 (crowd stopped)", () => {
    const moving   = computeCongestionScore(50, 3, 1.0);
    const stationary = computeCongestionScore(50, 3, 0.0);
    expect(stationary).toBeGreaterThan(moving);
  });

  it("never exceeds 100", () => {
    const score = computeCongestionScore(999, 999, 0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const score = computeCongestionScore(-50, -5, 2);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ── DEFAULT_NODES data integrity ─────────────────────────────────────────────

describe("DEFAULT_NODES integrity", () => {
  it("all exit nodes have isExit true", () => {
    const exits = DEFAULT_NODES.filter((n) => n.isExit);
    expect(exits.length).toBeGreaterThan(0);
    exits.forEach((n) => expect(n.isExit).toBe(true));
  });

  it("all node density values are between 0 and 100", () => {
    DEFAULT_NODES.forEach((n) => {
      expect(n.density).toBeGreaterThanOrEqual(0);
      expect(n.density).toBeLessThanOrEqual(100);
    });
  });

  it("DEFAULT_EDGES reference only valid node IDs", () => {
    const nodeIds = new Set(DEFAULT_NODES.map((n) => n.id));
    DEFAULT_EDGES.forEach((e) => {
      expect(nodeIds.has(e.from)).toBe(true);
      expect(nodeIds.has(e.to)).toBe(true);
    });
  });
});
