import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryData, Responder } from '../types';

export function useTelemetry() {
  const [activeScenario, setActiveScenario] = useState<'none' | 'evacuation'>('none');
  const activeScenarioRef = useRef(activeScenario);

  // Sync ref with state for the interval closure
  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  const [responders, setResponders] = useState<Responder[]>([
    { id: 'u-7', name: 'Unit 7', type: 'security', top: 40, left: 35, status: 'En Route', eta: '1m 30s' },
    { id: 'u-9', name: 'Unit 9', type: 'security', top: 45, left: 30, status: 'Patrol', eta: '' },
    { id: 'u-12', name: 'Unit 12', type: 'security', top: 20, left: 60, status: 'Stationary', eta: '' },
    { id: 'emt-4', name: 'EMT Unit 4', type: 'medical', top: 60, left: 50, status: 'On Scene', eta: '' },
    { id: 'fire-alpha', name: 'Fire Team Alpha', type: 'fire', top: 35, left: 60, status: 'En Route', eta: '45s' },
  ]);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    weather: { temp: 22.4, wind: 14.2, precip: 65, condition: 'Light Rain' },
    attendance: 42892,
    gateThroughput: 840,
    avgWaitTime: 4.2,
    waits: { ca: 18, cb: 8, rn: 2, rs: 12 },
    activeFlow: 94,
    fireTemp: 450,
    crowdDensity: 92,
    patientHeartRate: 115,
    units: {
      'u-7': { hr: 85, fat: 88 },
      'u-9': { hr: 72, fat: 45 },
      'u-12': { hr: 68, fat: 20 },
      'emt-4': { hr: 110, fat: 60 },
      'fire-alpha': { hr: 135, fat: 75 }
    },
    peakCapacity: 94,
    dwellTime: 3.2,
    growth: 12,
    gateFlows: [
      { gate: 'Gate A (North)', flow: 85, color: 'bg-primary-container' },
      { gate: 'Gate B (East)', flow: 95, color: 'bg-error' },
      { gate: 'Gate C (South)', flow: 45, color: 'bg-secondary-fixed' },
      { gate: 'Gate D (West)', flow: 60, color: 'bg-tertiary-fixed-dim' },
    ],
    flowData: [
      { value: 30 }, { value: 45 }, { value: 25 }, { value: 80 }, { value: 50 }, { value: 35 },
    ],
    sectorDist: 75,
    latency: 12,
    onlineFeeds: 142,
    activeComms: 8,
    activeIncidents: 3,
    criticalAlerts: 1,
    unitsDeployed: 42,
    velocity: 0.5,
    activeAlerts: [
      { id: 'a1', title: 'Overcrowding Event', description: 'Gate C capacity exceeded by 24%.', time: '02:45m Ago', severity: 'critical' },
      { id: 'a2', title: 'Medical Emergency', description: 'Sector 102 - Row J. Fainting reported.', time: '08:12m Ago', severity: 'warning' }
    ]
  });

  const triggerScenario = useCallback((scenario: 'none' | 'evacuation') => {
    setActiveScenario(scenario);
  }, []);

  const dispatchUnit = useCallback((unitId: string, location: string) => {
    setResponders(prev => prev.map(unit => {
      if (unit.id === unitId) {
        return { ...unit, status: 'En Route', eta: '2m 00s' };
      }
      return unit;
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Update responders
      setResponders(prev => prev.map(unit => {
        let moveTop = 0;
        let moveLeft = 0;
        let newStatus = unit.status;
        
        if (unit.status === 'En Route') {
           let targetTop = unit.top;
           let targetLeft = unit.left;
           if (unit.id === 'u-7') { targetTop = 33.33; targetLeft = 25; }
           else if (unit.id === 'fire-alpha') { targetTop = 20; targetLeft = 70; }
           else if (unit.id === 'u-9') { targetTop = 33.33; targetLeft = 25; }
           
           const distTop = targetTop - unit.top;
           const distLeft = targetLeft - unit.left;
           const distance = Math.sqrt(distTop*distTop + distLeft*distLeft);
           
           if (distance < 2) {
             newStatus = 'On Scene';
             unit.eta = '';
           } else {
             moveTop = (distTop / distance) * 1.5;
             moveLeft = (distLeft / distance) * 1.5;
           }
        } else if (unit.status === 'Patrol') {
           moveTop = (Math.random() - 0.5) * 2;
           moveLeft = (Math.random() - 0.5) * 2;
        } else {
           moveTop = (Math.random() - 0.5) * 0.2;
           moveLeft = (Math.random() - 0.5) * 0.2;
        }
        
        return {
          ...unit,
          status: newStatus,
          top: Math.max(10, Math.min(90, unit.top + moveTop)),
          left: Math.max(10, Math.min(90, unit.left + moveLeft)),
        };
      }));

      // Update telemetry
      setTelemetry(prev => {
        const isEvac = activeScenarioRef.current === 'evacuation';
        
        // Weather calculations
        const precipSpike = Math.random() > 0.9 ? Math.random() * 30 : 0;
        const windSpike = Math.random() > 0.9 ? Math.random() * 15 : 0;
        const newPrecip = isEvac 
          ? Math.min(100, prev.weather.precip + 12) 
          : Math.min(100, Math.max(0, prev.weather.precip + Math.floor(Math.random() * 3 - 1) + (precipSpike / 5)));
        const newWind = isEvac
          ? Math.min(120, prev.weather.wind + 10)
          : Number((Math.max(0, prev.weather.wind + (Math.random() * 1 - 0.5) + (windSpike / 10))).toFixed(1));
        
        const nextUnits = { ...prev.units };
        Object.keys(nextUnits).forEach(key => {
          nextUnits[key] = {
            hr: Math.max(60, Math.min(180, nextUnits[key].hr + (isEvac ? Math.floor(Math.random() * 15 - 2) : Math.floor(Math.random() * 5 - 2)))),
            fat: Math.min(100, Math.max(0, nextUnits[key].fat + (isEvac ? (Math.random() * 2) : (Math.random() * 0.3 - 0.05))))
          };
        });

        // Dynamic Alerts for Evacuation
        let nextAlerts = [...prev.activeAlerts];
        if (isEvac && Math.random() > 0.6) {
          const evacAlerts = [
            { id: `evac-${Date.now()}`, title: 'CRITICAL EGRESS', description: 'Gate B bottleneck detected. Redirecting to Gate D.', time: 'Just Now', severity: 'critical' as const },
            { id: `evac-${Date.now()}`, title: 'STRUCTURAL ALERT', description: 'Vibration sensors triggered in North Stand.', time: 'Just Now', severity: 'critical' as const },
            { id: `evac-${Date.now()}`, title: 'POWER FAILURE', description: 'Main grid offline. Backup generators at 80%.', time: 'Just Now', severity: 'critical' as const },
            { id: `evac-${Date.now()}`, title: 'COMMUNICATION LAG', description: 'High network congestion in Sector 4.', time: 'Just Now', severity: 'warning' as const }
          ];
          const randomAlert = evacAlerts[Math.floor(Math.random() * evacAlerts.length)];
          if (!nextAlerts.find(a => a.title === randomAlert.title)) {
            nextAlerts = [randomAlert, ...nextAlerts.slice(0, 4)];
          }
        }

        return {
          ...prev,
          weather: {
            temp: isEvac ? Number((prev.weather.temp - 1.2).toFixed(1)) : Number((prev.weather.temp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
            wind: newWind,
            precip: newPrecip,
            condition: isEvac ? 'Severe Storm' : (newPrecip > 80 ? 'Heavy Rain' : newPrecip > 40 ? 'Light Rain' : newPrecip > 15 ? 'Cloudy' : 'Clear')
          },
          attendance: isEvac ? Math.max(0, prev.attendance - Math.floor(Math.random() * 1500 + 1000)) : prev.attendance + (Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0),
          gateThroughput: isEvac ? Math.min(2500, prev.gateThroughput + Math.floor(Math.random() * 200 + 150)) : Math.floor(prev.gateThroughput + (Math.random() * 20 - 10)),
          avgWaitTime: isEvac ? Number((prev.avgWaitTime + 0.5).toFixed(1)) : Number((prev.avgWaitTime + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          waits: {
            ca: Math.max(0, prev.waits.ca + (isEvac ? 5 : Math.floor(Math.random() * 3 - 1))),
            cb: Math.max(0, prev.waits.cb + (isEvac ? 5 : Math.floor(Math.random() * 3 - 1))),
            rn: Math.max(0, prev.waits.rn + (isEvac ? 5 : Math.floor(Math.random() * 3 - 1))),
            rs: Math.max(0, prev.waits.rs + (isEvac ? 5 : Math.floor(Math.random() * 3 - 1))),
          },
          activeFlow: isEvac ? Math.max(10, prev.activeFlow - 5) : Math.min(100, Math.max(0, prev.activeFlow + Math.floor(Math.random() * 3 - 1))),
          fireTemp: isEvac ? Math.min(1200, prev.fireTemp + Math.floor(Math.random() * 50)) : Math.max(20, prev.fireTemp + Math.floor(Math.random() * 10 - 5)),
          crowdDensity: isEvac ? Math.min(100, prev.crowdDensity + 8) : Math.min(100, Math.max(0, prev.crowdDensity + Math.floor(Math.random() * 2 - 1))),
          patientHeartRate: isEvac ? Math.min(190, prev.patientHeartRate + 5) : Math.max(40, Math.min(180, prev.patientHeartRate + Math.floor(Math.random() * 6 - 3))),
          units: nextUnits,
          peakCapacity: isEvac ? 100 : Math.min(100, Math.max(80, prev.peakCapacity + Math.floor(Math.random() * 2 - 1))),
          dwellTime: isEvac ? Math.max(0.5, prev.dwellTime - 0.2) : Number((prev.dwellTime + (Math.random() * 0.1 - 0.05)).toFixed(1)),
          growth: isEvac ? 0 : Math.max(0, prev.growth + Math.floor(Math.random() * 2 - 1)),
          gateFlows: prev.gateFlows.map(gate => ({
            ...gate,
            flow: isEvac ? Math.min(100, gate.flow + 15) : Math.min(100, Math.max(20, gate.flow + Math.floor(Math.random() * 4 - 2))),
            color: isEvac ? 'bg-error' : (gate.flow > 85 ? 'bg-error' : gate.flow > 60 ? 'bg-secondary-fixed' : 'bg-primary-container')
          })),
          flowData: [...prev.flowData.slice(1), { value: isEvac ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30 }],
          sectorDist: isEvac ? Math.max(0, prev.sectorDist - 5) : Math.min(100, Math.max(0, prev.sectorDist + Math.floor(Math.random() * 2 - 1))),
          latency: isEvac ? Math.min(300, prev.latency + 25) : Math.max(8, prev.latency + Math.floor(Math.random() * 5 - 2)),
          onlineFeeds: isEvac ? Math.max(100, prev.onlineFeeds - 2) : Math.min(150, Math.max(135, prev.onlineFeeds + Math.floor(Math.random() * 2 - 1))),
          activeComms: isEvac ? Math.min(50, prev.activeComms + 5) : Math.max(5, prev.activeComms + Math.floor(Math.random() * 2 - 1)),
          activeIncidents: isEvac ? Math.min(25, prev.activeIncidents + (Math.random() > 0.5 ? 1 : 0)) : (Math.random() > 0.9 ? Math.max(1, prev.activeIncidents + (Math.random() > 0.5 ? 1 : -1)) : prev.activeIncidents),
          criticalAlerts: isEvac ? Math.min(10, prev.criticalAlerts + (Math.random() > 0.7 ? 1 : 0)) : (Math.random() > 0.95 ? Math.max(0, prev.criticalAlerts + (Math.random() > 0.5 ? 1 : -1)) : prev.criticalAlerts),
          unitsDeployed: isEvac ? Math.min(80, prev.unitsDeployed + 2) : (Math.random() > 0.8 ? Math.max(30, prev.unitsDeployed + (Math.random() > 0.5 ? 1 : -1)) : prev.unitsDeployed),
          velocity: Number((Math.max(0.1, prev.velocity + (isEvac ? 0.2 : (Math.random() * 0.1 - 0.05)))).toFixed(2)),
          activeAlerts: nextAlerts
        };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return {
    telemetry,
    responders,
    activeScenario,
    triggerScenario,
    dispatchUnit
  };
}
