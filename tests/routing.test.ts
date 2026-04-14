import { describe, it, expect } from 'vitest';
import { calculateEvacuationRoute } from '../client/src/utils/routing';

describe('Evacuation Routing Engine', () => {
  const mockTelemetry = {
    attendance: 40000,
    crowdDensity: 85
  };

  it('should find a path from the South Stand to the Main Exit', () => {
    const result = calculateEvacuationRoute('S1', mockTelemetry);
    expect(result.path).toContain('G3');
    expect(result.path[0]).toBe('S1');
  });

  it('should calculate a realistic safety score', () => {
    const highDensity = { attendance: 55000 };
    const lowDensity = { attendance: 10000 };
    
    const highResult = calculateEvacuationRoute('S1', highDensity);
    const lowResult = calculateEvacuationRoute('S1', lowDensity);
    
    expect(lowResult.safetyScore).toBeGreaterThan(highResult.safetyScore);
  });

  it('should handle invalid starting nodes gracefully', () => {
    // This expects the function to handle unknown IDs
    const result = calculateEvacuationRoute('UNKNOWN', mockTelemetry);
    expect(result.path).toBeDefined();
  });
});
