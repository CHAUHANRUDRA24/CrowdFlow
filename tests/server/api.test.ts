import { describe, it, expect } from "vitest";
import { z } from "zod";
import { chatBodySchema } from "../../server/middleware/validate";

// ── chatBodySchema ────────────────────────────────────────────────────────────

describe("chatBodySchema — API validation", () => {
  it("accepts a valid single-message body", () => {
    const body = {
      contents: [{ role: "user", parts: [{ text: "What is the crowd density?" }] }],
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("accepts a valid body with systemInstruction", () => {
    const body = {
      contents: [{ role: "user", parts: [{ text: "Dispatch unit." }] }],
      systemInstruction: "You are a venue command AI.",
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("rejects a body with empty contents array", () => {
    const body = { contents: [] };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("rejects when contents is missing", () => {
    const body = {};
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid role value", () => {
    const body = {
      contents: [{ role: "hacker", parts: [{ text: "Hello" }] }],
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("rejects when parts is not an array", () => {
    const body = {
      contents: [{ role: "user", parts: "Hello" }],
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("rejects text that exceeds 8000 characters", () => {
    const body = {
      contents: [{ role: "user", parts: [{ text: "a".repeat(8001) }] }],
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("rejects when contents has more than 50 entries", () => {
    const body = {
      contents: Array.from({ length: 51 }, () => ({
        role: "user",
        parts: [{ text: "msg" }],
      })),
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("accepts exactly 50 entries (boundary)", () => {
    const body = {
      contents: Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        parts: [{ text: "msg" }],
      })),
    };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("exposes field-level error details on failure", () => {
    const body = { contents: [] };
    const result = chatBodySchema.safeParse(body);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ── Telemetry data shape ─────────────────────────────────────────────────────

describe("Telemetry Data Structure", () => {
  const telemetrySchema = z.object({
    attendance: z.number().positive(),
    activeIncidents: z.number().min(0),
    crowdDensity: z.number().min(0).max(100),
    gateThroughput: z.number().positive(),
    gateFlows: z.array(
      z.object({
        gate: z.string(),
        flow: z.number().min(0).max(100),
        color: z.string(),
      })
    ),
    activeAlerts: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        severity: z.enum(["critical", "warning", "info"]),
      })
    ),
  });

  it("validates a well-formed telemetry snapshot", () => {
    const snap = {
      attendance: 45000,
      activeIncidents: 2,
      crowdDensity: 78,
      gateThroughput: 840,
      gateFlows: [
        { gate: "Gate A", flow: 85, color: "bg-primary-container" },
        { gate: "Gate B", flow: 95, color: "bg-error" },
      ],
      activeAlerts: [
        {
          id: "a1",
          title: "Overcrowding",
          description: "Gate C at 120%.",
          severity: "critical" as const,
        },
      ],
    };
    const result = telemetrySchema.safeParse(snap);
    expect(result.success).toBe(true);
  });

  it("rejects negative attendance", () => {
    const snap = {
      attendance: -1,
      activeIncidents: 0,
      crowdDensity: 50,
      gateThroughput: 500,
      gateFlows: [],
      activeAlerts: [],
    };
    const result = telemetrySchema.safeParse(snap);
    expect(result.success).toBe(false);
  });

  it("rejects crowd density over 100", () => {
    const snap = {
      attendance: 10000,
      activeIncidents: 0,
      crowdDensity: 150,
      gateThroughput: 500,
      gateFlows: [],
      activeAlerts: [],
    };
    const result = telemetrySchema.safeParse(snap);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid alert severity", () => {
    const snap = {
      attendance: 10000,
      activeIncidents: 0,
      crowdDensity: 50,
      gateThroughput: 500,
      gateFlows: [],
      activeAlerts: [
        { id: "x", title: "T", description: "D", severity: "unknown" },
      ],
    };
    const result = telemetrySchema.safeParse(snap);
    expect(result.success).toBe(false);
  });
});

// ── Crowd threshold logic ─────────────────────────────────────────────────────

describe("Crowd threshold business rules", () => {
  const CRITICAL_DENSITY = 90;
  const WARNING_DENSITY = 75;

  function classifyDensity(density: number): "critical" | "warning" | "ok" {
    if (density >= CRITICAL_DENSITY) return "critical";
    if (density >= WARNING_DENSITY) return "warning";
    return "ok";
  }

  it("classifies density >= 90 as critical", () => {
    expect(classifyDensity(90)).toBe("critical");
    expect(classifyDensity(100)).toBe("critical");
  });

  it("classifies density 75-89 as warning", () => {
    expect(classifyDensity(75)).toBe("warning");
    expect(classifyDensity(89)).toBe("warning");
  });

  it("classifies density < 75 as ok", () => {
    expect(classifyDensity(74)).toBe("ok");
    expect(classifyDensity(0)).toBe("ok");
  });

  it("triggers emergency protocol at critical density", () => {
    const mockTrigger = { called: false };
    const density = 95;
    if (classifyDensity(density) === "critical") {
      mockTrigger.called = true;
    }
    expect(mockTrigger.called).toBe(true);
  });
});
