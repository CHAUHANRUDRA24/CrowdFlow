import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { validate, chatBodySchema } from "./middleware/validate.js";
import { auditLog, auditError } from "./middleware/audit.js";
import {
  computeEvacRoute,
  recommendLeastCrowdedGate,
  computeCongestionScore,
  DEFAULT_NODES,
} from "./routing/evacRouting.js";
import { runSimulation } from "./simulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // ── Security Middleware ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false,      // Disabled for Vite dev compatibility
      crossOriginOpenerPolicy: false,    // Required for Firebase Auth redirects
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(express.json({ limit: "256kb" })); // Prevent request body bombs
  app.use("/api/", apiLimiter);

  // ── Health ───────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "2.0.0" });
  });

  // ── Routing Engine ───────────────────────────────────────────────────────────

  /**
   * POST /api/routing/evac
   * Compute safest evacuation route using Dijkstra's algorithm.
   * Body: { sourceId: string, targetId?: string }
   */
  app.post("/api/routing/evac", (req, res) => {
    const { sourceId, targetId } = req.body ?? {};
    if (!sourceId || typeof sourceId !== "string") {
      return res.status(400).json({ error: "sourceId is required" });
    }

    const result = computeEvacRoute(
      sourceId,
      targetId ?? null,
      DEFAULT_NODES
    );

    if (!result) {
      return res
        .status(404)
        .json({ error: "No route found from the specified source" });
    }

    auditLog("ROUTING_COMPUTED", { sourceId, targetId, path: result.path });
    res.json(result);
  });

  /**
   * GET /api/routing/best-gate
   * Returns the least-congested exit gate.
   */
  app.get("/api/routing/best-gate", (_req, res) => {
    const gate = recommendLeastCrowdedGate(DEFAULT_NODES);
    res.json({ gate });
  });

  /**
   * POST /api/routing/congestion-score
   * Compute a composite congestion score for a zone.
   * Body: { density: number, waitMinutes: number, velocity: number }
   */
  app.post("/api/routing/congestion-score", (req, res) => {
    const { density, waitMinutes, velocity } = req.body ?? {};
    if (
      typeof density !== "number" ||
      typeof waitMinutes !== "number" ||
      typeof velocity !== "number"
    ) {
      return res
        .status(400)
        .json({ error: "density, waitMinutes, and velocity must be numbers" });
    }
    const score = computeCongestionScore(density, waitMinutes, velocity);
    res.json({ score });
  });

  // ── Gemini Chat (AI Neural Core) ─────────────────────────────────────────────
  app.post("/api/chat", validate(chatBodySchema), async (req, res) => {
    const { contents, systemInstruction } = (req as any).validatedBody;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      auditError("GEMINI_KEY_MISSING", new Error("GEMINI_API_KEY not set"));
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const functionDeclarations: FunctionDeclaration[] = [
        {
          name: "triggerEvacDrill",
          description: "Triggers the venue-wide evacuation drill scenario.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "endEvacDrill",
          description:
            "Ends the evacuation drill and returns to normal operations.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "broadcastMessage",
          description:
            "Broadcasts a global alert message to all screens and PA systems.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "The message to broadcast.",
              },
            },
            required: ["message"],
          },
        },
        {
          name: "dispatchUnit",
          description: "Dispatches a security or medical unit to a specific location.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              unitId: {
                type: Type.STRING,
                description: "The ID of the unit to dispatch.",
              },
              location: {
                type: Type.STRING,
                description: "The location to dispatch to.",
              },
            },
            required: ["unitId", "location"],
          },
        },
        {
          name: "calculateSafestRoute",
          description: "Calculates the safest, least-congested evacuation route from a source zone to an exit using the Dijkstra engine.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              sourceId: {
                type: Type.STRING,
                description: "The ID of the source zone (e.g., sector-102, south-plaza).",
              },
              targetId: {
                type: Type.STRING,
                description: "Optional: The ID of a specific target exit gate.",
              },
            },
            required: ["sourceId"],
          },
        },
      ];

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }],
          temperature: 0.7,
        },
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of responseStream) {
        res.write(
          `data: ${JSON.stringify({
            text: chunk.text,
            functionCalls: chunk.functionCalls,
            candidates: chunk.candidates,
          })}\n\n`
        );
      }

      res.write("data: [DONE]\n\n");
      res.end();

      auditLog("GEMINI_CHAT_COMPLETE", { messageCount: contents.length });
    } catch (err) {
      auditError("GEMINI_CHAT_ERROR", err);
      // Never expose raw error internals to the client
      res.status(500).json({ error: "AI service temporarily unavailable" });
    }
  });

  // ── Vite Dev / Static Prod ───────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "client"),
    });
    app.use(vite.middlewares);
  } else {
    // The built react application is inside the client/dist folder
    const distPath = path.join(process.cwd(), "client", "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    auditLog("SERVER_START", { port: PORT, env: process.env.NODE_ENV ?? "development" });
    
    // Start simulation engine feeding Firestore
    if (process.env.RUN_SIMULATION === 'true') {
      runSimulation().catch(err => auditError("SIMULATION_ERROR", err));
    }
  });
}

startServer();
