import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AIAssistant from './AIAssistant';
import { TelemetryData } from '../types';

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

describe('AIAssistant Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AIAssistant 
        isOpen={false} 
        onClose={() => {}} 
        telemetry={mockTelemetry} 
        onTriggerEvacDrill={() => {}}
        onEndEvacDrill={() => {}}
        onBroadcastMessage={() => {}}
        onDispatchUnit={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <AIAssistant 
        isOpen={true} 
        onClose={() => {}} 
        telemetry={mockTelemetry} 
        onTriggerEvacDrill={() => {}}
        onEndEvacDrill={() => {}}
        onBroadcastMessage={() => {}}
        onDispatchUnit={() => {}}
      />
    );
    expect(screen.getByText('Neural Core')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Query Neural Core...')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <AIAssistant 
        isOpen={true} 
        onClose={handleClose} 
        telemetry={mockTelemetry} 
        onTriggerEvacDrill={() => {}}
        onEndEvacDrill={() => {}}
        onBroadcastMessage={() => {}}
        onDispatchUnit={() => {}}
      />
    );
    const closeButton = screen.getByLabelText('Close AI Assistant');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
