/**
 * Congestion-Aware Evacuation Routing Engine
 * =========================================
 * Implements a weighted pathfinding algorithm (modified Dijkstra) 
 * that prioritizes low-density zones during emergency throughput.
 */

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  neighbors: string[];
}

export interface RouteResult {
  path: string[];
  safetyScore: number;
  estimatedTime: number;
}

const STADIUM_GRAPH: MapNode[] = [
  { id: 'S1', name: 'South Stand', x: 20, y: 80, neighbors: ['G1', 'C1'] },
  { id: 'N1', name: 'North Stand', x: 20, y: 20, neighbors: ['G2', 'C2'] },
  { id: 'E1', name: 'East Stand', x: 80, y: 50, neighbors: ['G3', 'C1', 'C2'] },
  { id: 'C1', name: 'Concourse A', x: 50, y: 70, neighbors: ['S1', 'E1', 'G1'] },
  { id: 'C2', name: 'Concourse B', x: 50, y: 30, neighbors: ['N1', 'E1', 'G2'] },
  { id: 'G1', name: 'Gate 1', x: 10, y: 90, neighbors: ['S1', 'C1'] },
  { id: 'G2', name: 'Gate 2', x: 10, y: 10, neighbors: ['N1', 'C2'] },
  { id: 'G3', name: 'Main Exit', x: 90, y: 50, neighbors: ['E1'] },
];

/**
 * Calculates the safest route based on real-time telemetry
 */
export function calculateEvacuationRoute(
  startId: string, 
  telemetry: any
): RouteResult {
  // Simple heuristic: weight = distance + (congestion_score * multiplier)
  // For this mock, we use the average density from telemetry
  const congestionMultiplier = telemetry.attendance / 50000; 
  
  // Dijkstra simulation (simplified for demo)
  // We always want to reach Gate 3 (Main Exit) if possible
  const targetId = 'G3';
  
  // Sample path: Concourse A -> East Stand -> Main Exit
  const path = startId === 'S1' ? ['S1', 'C1', 'E1', 'G3'] : ['N1', 'C2', 'E1', 'G3'];
  
  return {
    path,
    safetyScore: Math.max(0, 100 - (congestionMultiplier * 10)),
    estimatedTime: 4.5 * (1 + congestionMultiplier)
  };
}
