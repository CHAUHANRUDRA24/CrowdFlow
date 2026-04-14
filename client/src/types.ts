export interface Responder {
  id: string;
  name: string;
  type: string;
  top: number;
  left: number;
  status: string;
  eta: string;
}

export interface TelemetryData {
  weather: { temp: number; wind: number; precip: number; condition: string };
  attendance: number;
  gateThroughput: number;
  avgWaitTime: number;
  waits: { ca: number; cb: number; rn: number; rs: number };
  activeFlow: number;
  fireTemp: number;
  crowdDensity: number;
  patientHeartRate: number;
  units: Record<string, { hr: number; fat: number }>;
  peakCapacity: number;
  dwellTime: number;
  growth: number;
  gateFlows: { gate: string; flow: number; color: string }[];
  flowData: { value: number }[];
  sectorDist: number;
  latency: number;
  onlineFeeds: number;
  activeComms: number;
  activeIncidents: number;
  criticalAlerts: number;
  unitsDeployed: number;
  velocity: number;
  activeAlerts: { id: string; title: string; description: string; time: string; severity: 'critical' | 'warning' | 'info' }[];
  lastUpdated?: any;
}
