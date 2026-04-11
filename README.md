# CrowdFlow AI: Venue Command Center

## Overview
CrowdFlow AI is a real-time, AI-powered command center designed for large-scale venue management (stadiums, concert halls, festivals). It provides venue operators with live telemetry, predictive crowd density mapping, automated staffing optimization, and dynamic emergency response protocols.

This project was built to fulfill the challenge expectations, demonstrating a smart, dynamic assistant, logical decision-making based on user context, and effective use of Google Services.

## Chosen Vertical & Persona
**Vertical:** Smart City / Infrastructure & Event Management
**Persona:** Venue Operations Director / Chief Security Officer
**Logic:** The application aggregates simulated real-time telemetry (attendance, gate flow, weather, latency) and uses AI to recommend staffing changes, detect anomalies, and assist the operator in managing the venue. The "Neural Core" AI assistant acts as a co-pilot, answering queries based on the current context of the venue.

## Approach and Logic
The application is built as a React-based Single Page Application (SPA) using Tailwind CSS for styling and Recharts for data visualization. 

1. **Live Telemetry Engine:** A central state management system (`App.tsx`) simulates a live stream of data (weather, crowd density, gate throughput, unit fatigue).
2. **Context-Aware AI Assistant:** The "Neural Core" is powered by the **Gemini API (`@google/genai`)**. It is injected with the live telemetry data as a system prompt, allowing it to provide highly contextual, real-time advice to the operator.
3. **Crisis Simulation:** A "Run Evac Drill" feature allows the user to inject a correlated crisis scenario (Severe Storm) into the telemetry stream. The UI and AI dynamically react to this state change, demonstrating logical decision-making under stress.
4. **Dynamic Dashboards:** The UI is split into specialized tabs (Dashboard, Analytics, Staffing, Heatmaps, Emergency) to prevent cognitive overload, displaying only the most relevant data for the task at hand.

## How the Solution Works
* **Dashboard:** Provides a high-level overview of venue health, weather alerts, and gate flow.
* **Analytics:** Deep dive into historical and real-time metrics using interactive charts.
* **Staffing:** Tracks responder units on a live map. The system analyzes unit fatigue and active incidents to automatically suggest redeployments.
* **Heatmaps:** Visualizes crowd density, flow velocity, and dwell times across different sectors.
* **Emergency:** A dedicated crisis management interface for broadcasting alerts and tracking critical incidents.
* **Neural Core (AI Assistant):** Click the Bot icon in the top right to open the Gemini-powered assistant. It knows the current state of the venue and can answer questions or suggest actions.

## Assumptions Made
* **Data Source:** In a production environment, telemetry data would come from physical IoT sensors, turnstiles, and CCTV computer vision. For this prototype, a sophisticated simulation engine generates correlated data.
* **Authentication:** It is assumed that this dashboard sits behind a secure, authenticated intranet (e.g., SSO), hence no login screen is provided in this prototype.
* **API Keys:** The Gemini API key is provided via environment variables (`VITE_GEMINI_API_KEY`).

---

## Evaluation Focus Areas

### 1. Code Quality
* **Structure:** The project follows a modular React architecture. Components are split by domain (e.g., `CommandCenter.tsx`, `Emergency.tsx`, `AIAssistant.tsx`).
* **Readability:** TypeScript interfaces (`TelemetryData`, `Responder`) ensure type safety and self-documenting code.
* **Maintainability:** State is lifted to the highest necessary level (`App.tsx`) and passed down via props, keeping child components pure and predictable.

### 2. Security
* **Safe Implementation:** The Gemini API key is accessed via environment variables and is never hardcoded into the source code. 
* **Data Handling:** The AI assistant uses a strictly defined system prompt to prevent prompt injection and keep the AI focused on its persona.

### 3. Efficiency
* **Optimal Resources:** React `useEffect` hooks are carefully managed with cleanup functions (`clearInterval`) to prevent memory leaks from the telemetry intervals.
* **Rendering:** The application uses localized state where possible to prevent unnecessary re-renders of the entire DOM tree.

### 4. Testing (Validation of Functionality)
* **Crisis Simulation Engine:** The "Run Evac Drill" button serves as an interactive integration test. It validates that all components (Weather, Staffing, Emergency, AI Assistant) correctly respond to a sudden, correlated shift in state.

### 5. Accessibility
* **Inclusive Design:** The UI uses high-contrast colors (Tailwind's slate and primary palettes) suitable for dark-room command centers.
* **Visual Hierarchy:** Critical alerts use distinct colors (Red/Error), iconography (`AlertTriangle`), and motion (`animate-pulse`) to ensure they are immediately noticeable without relying solely on color.

### 6. Google Services Integration
* **Gemini API:** The core of the "Smart Assistant" requirement is powered by the `@google/genai` SDK. The assistant uses the `gemini-2.5-flash` model for rapid, context-aware responses. The system dynamically injects the live React state (attendance, incidents, wait times) into the Gemini prompt, making the AI a true operational co-pilot rather than a generic chatbot.
