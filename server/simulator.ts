import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { TelemetryData, Responder } from "../src/types.js";

/**
 * CrowdFlow Venue Simulator
 * ========================
 * This script simulates live venue activity by pushing updates to Firestore.
 * It mimics real-world sensor data (turnstiles, weather station, GPS trackers).
 */

function getAdminDb() {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.warn("⚠️ FIREBASE_PRIVATE_KEY is missing. Simulation engine will run in mock mode without writing to Firestore.");
    return null;
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore(process.env.FIREBASE_DATABASE_ID || '(default)');
}

export async function runSimulation() {
  const db = getAdminDb();
  if (!db) return; // Simulation gracefully exits if no credentials

  console.log("🌊 CrowdFlow Simulation Engine Started...");

  setInterval(async () => {
    try {
      const scenarioDoc = await db.collection("system").doc("scenario").get();
      const activeScenario = scenarioDoc.data()?.type || "none";
      const isEvac = activeScenario === "evacuation";

      // 1. Update Telemetry
      const telSnap = await db.collection("live").doc("telemetry").get();
      if (telSnap.exists) {
        const prev = telSnap.data() as TelemetryData;
        
        const nextTelemetry: TelemetryData = {
          ...prev,
          attendance: isEvac ? Math.max(0, prev.attendance - 1200) : prev.attendance + (Math.random() > 0.8 ? 5 : 0),
          crowdDensity: isEvac ? Math.min(100, prev.crowdDensity + 5) : Math.min(100, Math.max(0, prev.crowdDensity + (Math.random() * 2 - 1))),
          weather: {
            ...prev.weather,
            temp: isEvac ? prev.weather.temp - 0.2 : prev.weather.temp + (Math.random() * 0.1 - 0.05),
          },
          gateThroughput: isEvac ? 1800 + Math.random() * 400 : 800 + Math.random() * 100,
          lastUpdated: new Date()
        };

        await db.collection("live").doc("telemetry").set(nextTelemetry, { merge: true });
      }

      // 2. Update Responder Positions
      const respondersSnap = await db.collection("responders").get();
      for (const doc of respondersSnap.docs) {
        const r = doc.data() as Responder;
        let moveTop = (Math.random() - 0.5) * 0.5;
        let moveLeft = (Math.random() - 0.5) * 0.5;
        
        if (r.status === 'En Route') {
            moveTop = (Math.random() - 0.5) * 2;
            moveLeft = (Math.random() - 0.5) * 2;
        }

        await doc.ref.update({
          top: Math.max(10, Math.min(90, r.top + moveTop)),
          left: Math.max(10, Math.min(90, r.left + moveLeft))
        });
      }

    } catch (e) {
      console.error("Simulation tick failed:", e);
    }
  }, 3000);
}
