import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local dev/Vite compatibility
    crossOriginOpenerPolicy: false, // Disabled to allow Firebase Auth Popups
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(express.json());

  // Apply rate limiting to API routes
  app.use("/api/", apiLimiter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { contents, systemInstruction } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const triggerEvacDrillDeclaration: FunctionDeclaration = {
        name: "triggerEvacDrill",
        description: "Triggers the venue-wide evacuation drill scenario.",
        parameters: { type: Type.OBJECT, properties: {} },
      };

      const endEvacDrillDeclaration: FunctionDeclaration = {
        name: "endEvacDrill",
        description:
          "Ends the venue-wide evacuation drill scenario and returns to normal operations.",
        parameters: { type: Type.OBJECT, properties: {} },
      };

      const broadcastMessageDeclaration: FunctionDeclaration = {
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
      };

      const dispatchUnitDeclaration: FunctionDeclaration = {
        name: "dispatchUnit",
        description:
          "Dispatches a security or medical unit to a specific location.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            unitId: {
              type: Type.STRING,
              description: "The ID of the unit to dispatch (e.g., u-7, emt-4).",
            },
            location: {
              type: Type.STRING,
              description:
                "The location to dispatch the unit to (e.g., Gate C, Sector 102).",
            },
          },
          required: ["unitId", "location"],
        },
      };

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: [
            {
              functionDeclarations: [
                triggerEvacDrillDeclaration,
                endEvacDrillDeclaration,
                broadcastMessageDeclaration,
                dispatchUnitDeclaration,
              ],
            },
          ],
          temperature: 0.7,
        },
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify({
          text: chunk.text,
          functionCalls: chunk.functionCalls,
          candidates: chunk.candidates
        })}\n\n`);
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to generate response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
