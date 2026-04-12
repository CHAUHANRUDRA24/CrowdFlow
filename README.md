# 🌊 CrowdFlow: AI-Powered Venue Intelligence

> **Preventing crowd crushes and optimizing venue safety using real-time telemetry and Gemini-powered decision support.**

![CrowdFlow Dashboard](https://images.unsplash.com/photo-1540039155733-d76e6148e18e?q=80&w=2000&auto=format&fit=crop) *(Note: Add a screenshot of your actual dashboard here before submitting!)*

## 🚨 The Problem
Managing large crowds at stadiums, transit hubs, and festivals is a high-stakes operational challenge. Traditional security teams rely on fragmented camera feeds and static radios. When a bottleneck forms or an emergency occurs, reaction times are slow, leading to dangerous overcrowding, panic, and inefficient resource deployment.

## 💡 The Solution
**CrowdFlow** is a next-generation Command Center dashboard that acts as a central nervous system for large venues. It aggregates live telemetry (crowd density, gate throughput, weather, staff locations) and uses **Google's Gemini API** as an operational "Neural Core." 

Instead of just chatting with an AI, CrowdFlow's AI ingests the live data stream, allowing venue managers to ask context-aware questions and execute emergency protocols instantly.

## ✨ Key Features
* **Live Telemetry Engine:** Real-time simulation of venue metrics including gate flow, sector density, and wait times.
* **Context-Aware AI (Neural Core):** Powered by Gemini. The AI reads the live JSON telemetry stream, allowing it to understand exactly what is happening in the venue at any given second.
* **Emergency Protocol Execution:** Trigger venue-wide evacuations, dispatch medical units, and broadcast alerts directly through the AI or the dashboard.
* **High-Fidelity UI:** A dark-mode, sci-fi-inspired interface built for high-stress Security Operations Centers (SOC), featuring smooth animations and data visualizations.
* **Secure Access:** Role-based authentication powered by Firebase.

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Framer Motion (for fluid UI transitions), Lucide Icons
* **Backend / AI:** Node.js/Express (API routing), `@google/genai` (Gemini API)
* **Auth:** Firebase Authentication
* **Architecture:** Custom React Hooks (`useTelemetry`) for modular state management and data streaming.

## 🧠 How the AI Works (The "Wow" Factor)
CrowdFlow doesn't just use AI for text generation. Every 2.5 seconds, the `useTelemetry` hook updates the venue's state. When a user opens the AI Assistant, the **entire live telemetry JSON object** is injected into Gemini's system prompt. 

This means you can ask the AI: *"Which gate is currently the most crowded?"* or *"Dispatch a medical unit to the sector with the highest temperature,"* and Gemini will analyze the live data and execute the function call.

## 🚀 Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crowdflow.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (create a `.env` file):
   ```env
   GEMINI_API_KEY=your_google_gemini_key
   # Add your Firebase config variables here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔮 Future Roadmap
* **IoT Integration:** Replace the simulated telemetry hook with real WebSockets connected to physical turnstiles and LiDAR crowd sensors.
* **Google Maps Integration:** Overlay live crowd heatmaps onto real-world satellite imagery using the Maps JavaScript API.
* **Predictive Analytics:** Use Vertex AI to predict crowd crushes 15 minutes before they happen based on historical flow data.

---
*Built with ❤️ for the Hackathon.*
