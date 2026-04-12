# CrowdFlow AI - Venue Command Center

A production-ready full-stack web application designed for Google Cloud Run. This application provides a modern dashboard for venue management, featuring a "Neural Core" AI assistant powered by the Gemini API.

## Features

- **Responsive Dashboard:** Real-time telemetry, heatmaps, and staff coordination.
- **AI Assistant:** Powered by Gemini 2.5 Flash, capable of calling functions to trigger drills, broadcast messages, and dispatch units.
- **Full-Stack Architecture:** Express backend serving a Vite React frontend.
- **Cloud Run Ready:** Configured to listen on `0.0.0.0` and use the `PORT` environment variable.

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `GEMINI_API_KEY=your_actual_api_key`.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment to Google Cloud Run

This application is designed to be easily deployed to Google Cloud Run.

### Prerequisites

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and configured.
- A Google Cloud project with billing enabled.
- Cloud Run API enabled.

### Deployment Steps

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   ```

2. **Set your Google Cloud project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy to Cloud Run:**
   Run the following command from the root of the project. Cloud Run will automatically build the container using the provided `Dockerfile` and deploy it.
   ```bash
   gcloud run deploy crowdflow-ai --source . --region us-central1 --allow-unauthenticated
   ```

4. **Set the Gemini API Key in Cloud Run:**
   After deployment, you need to provide the Gemini API key to the service. You can do this via the Cloud Console UI or using the CLI:
   ```bash
   gcloud run services update crowdflow-ai --region us-central1 --update-env-vars GEMINI_API_KEY=your_actual_api_key
   ```

### Common Deployment Errors and Fixes

- **`Container failed to start. Failed to listen on PORT.`**
  *Fix:* Ensure the Express server is listening on `0.0.0.0` and using `process.env.PORT`. This is already configured in `server.ts`.
- **`Missing GEMINI_API_KEY` or AI assistant failing to respond.**
  *Fix:* The environment variable `GEMINI_API_KEY` must be set in the Cloud Run service configuration (Step 4 above). Do not hardcode the key in your source code.
- **Build fails during `npm run build`.**
  *Fix:* Ensure all TypeScript types are correct. You can test the build locally by running `npm run build` before deploying.

## Architecture

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Express.js, `@google/genai` SDK.
- **Integration:** The frontend communicates with the backend via the `/api/chat` endpoint, keeping the Gemini API key secure on the server.
