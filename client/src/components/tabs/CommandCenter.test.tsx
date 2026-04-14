import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CommandCenter from './CommandCenter';
import { TelemetryData } from '../../types';

const mockTelemetry: TelemetryData = {
  attendance: 45000,
  weather: { condition: 'Clear', temp: 22, wind: 10, precip: 0 },
  activeFlow: 85,
  crowdDensity: 60,
  gateThroughput: 1200,
  avgWaitTime: 12.5,
  waits: { ca: 10, cb: 12, rn: 8, rs: 15 },
  fireTemp: 22,
  patientHeartRate: 75,
  units: {},
  peakCapacity: 50000,
  dwellTime: 180,
  growth: 5,
  gateFlows: [],
  flowData: [],
  sectorDist: 40,
  latency: 12,
  onlineFeeds: 150,
  activeComms: 45,
  activeIncidents: 2,
  criticalAlerts: 0,
  unitsDeployed: 15,
  velocity: 1.2,
  activeAlerts: []
};

describe('CommandCenter Component', () => {
  it('renders telemetry data correctly', () => {
    render(<CommandCenter telemetry={mockTelemetry} />);
    
    // Check if attendance is rendered
    expect(screen.getByText('45,000')).toBeInTheDocument();
    
    // Check if avg wait time is rendered
    expect(screen.getByText('12.5m')).toBeInTheDocument();
    
    // Check if active incidents is rendered
    expect(screen.getByText('02')).toBeInTheDocument();
  });
});
