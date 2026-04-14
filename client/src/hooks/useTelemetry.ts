import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryData, Responder } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection } from 'firebase/firestore';

const MOCK_TELEMETRY: TelemetryData = {
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
    'u-7': { hr: 85, fat: 88 }, 'u-9': { hr: 72, fat: 45 }, 'u-12': { hr: 68, fat: 20 },
    'emt-4': { hr: 110, fat: 60 }, 'fire-alpha': { hr: 135, fat: 75 }
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
  flowData: Array.from({length: 6}, () => ({ value: 30 + Math.floor(Math.random() * 50) })),
  sectorDist: 75,
  latency: 12, onlineFeeds: 142, activeComms: 8, activeIncidents: 3, criticalAlerts: 1, unitsDeployed: 42, velocity: 0.5,
  activeAlerts: [
    { id: 'a1', title: 'Overcrowding Event', description: 'Gate C capacity exceeded by 24%.', time: '02:45m Ago', severity: 'critical' },
    { id: 'a2', title: 'Medical Emergency', description: 'Sector 102 - Row J. Fainting reported.', time: '08:12m Ago', severity: 'warning' }
  ]
};

const MOCK_RESPONDERS: Responder[] = [
  { id: 'u-7', name: 'Unit 7', type: 'security', top: 40, left: 35, status: 'Patrol', eta: '' },
  { id: 'u-9', name: 'Unit 9', type: 'security', top: 45, left: 30, status: 'Patrol', eta: '' },
  { id: 'u-12', name: 'Unit 12', type: 'security', top: 20, left: 60, status: 'Stationary', eta: '' },
  { id: 'emt-4', name: 'EMT Unit 4', type: 'medical', top: 60, left: 50, status: 'On Scene', eta: '' },
  { id: 'fire-alpha', name: 'Fire Team Alpha', type: 'fire', top: 35, left: 60, status: 'Stationary', eta: '' },
];

/**
 * useTelemetry Hook
 * =================
 * Now powered by Google Cloud Firestore (Real-time).
 * Synchronizes venue state across all authenticated command center instances instantly.
 */
export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [activeScenario, setActiveScenario] = useState<'none' | 'evacuation'>('none');
  const [isLive, setIsLive] = useState(false);

  // 1. Listen for Live Telemetry from Firestore
  useEffect(() => {
    const telemetryDoc = doc(db, 'live', 'telemetry');
    
    const unsubscribe = onSnapshot(telemetryDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TelemetryData;
        setTelemetry(data);
        setIsLive(true);
      } else {
        // Fallback for first-time use: Seed initial data
        console.warn("Telemetry doc missing, using local fallback...");
        setTelemetry(MOCK_TELEMETRY);
        setIsLive(false);
        seedInitialData();
      }
    }, (error) => {
      console.error("Firestore telemetry error:", error);
      // If permission is denied, fallback to local mock data so the UI still works
      if (error.code === 'permission-denied') {
          console.warn("Permission denied for Firestore. Using offline mock data.");
          setTelemetry(MOCK_TELEMETRY);
          setResponders(MOCK_RESPONDERS);
      }
      setIsLive(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen for Responder Movements
  useEffect(() => {
    const respondersCollection = collection(db, 'responders');
    const unsubscribe = onSnapshot(respondersCollection, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Responder));
      setResponders(docs);
    });
    return () => unsubscribe();
  }, []);

  // 3. Scenario Sync (Global toggle)
  useEffect(() => {
    const scenarioDoc = doc(db, 'system', 'scenario');
    const unsubscribe = onSnapshot(scenarioDoc, (snapshot) => {
      if (snapshot.exists()) {
        setActiveScenario(snapshot.data().type || 'none');
      }
    });
    return () => unsubscribe();
  }, []);

  /* ── Actions ─────────────────────────────────────────────────── */

  const triggerScenario = useCallback(async (scenario: 'none' | 'evacuation') => {
    try {
      await setDoc(doc(db, 'system', 'scenario'), { type: scenario, updatedAt: new Date() });
      // Logic for mass state updates would happen via a Cloud Function or Server-side emitter
    } catch (e) {
      console.error("Failed to trigger scenario:", e);
    }
  }, []);

  const dispatchUnit = useCallback(async (unitId: string, location: string) => {
    try {
      await updateDoc(doc(db, 'responders', unitId), {
        status: 'En Route',
        eta: '2m 00s',
        targetLocation: location,
        lastUpdated: new Date()
      });
    } catch (e) {
      console.error("Failed to dispatch unit:", e);
    }
  }, []);

  return {
    telemetry,
    responders,
    activeScenario,
    triggerScenario,
    dispatchUnit,
    isLive
  };
}

/**
 * Seeding logic to ensure the database isn't empty on first run
 */
async function seedInitialData() {
  try {
    await setDoc(doc(db, 'live', 'telemetry'), MOCK_TELEMETRY);
    for (const r of MOCK_RESPONDERS) {
      await setDoc(doc(db, 'responders', r.id), r);
    }
    await setDoc(doc(db, 'system', 'scenario'), { type: 'none' });
  } catch (e) {
    console.error("Seeding failed (expected if non-admin):", e);
  }
}
