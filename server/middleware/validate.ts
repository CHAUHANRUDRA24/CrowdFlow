import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { auditLog } from "./audit.js";

/**
 * Middleware factory: validates req.body against a Zod schema.
 * Returns 400 with sanitised field errors on failure.
 *
 * Usage:
 *   app.post('/api/chat', validate(chatBodySchema), handler)
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      auditLog("VALIDATION_FAILURE", {
        path: req.path,
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return res.status(400).json({
        error: "Invalid request",
        // Only expose field names + messages, not internal stack
        details: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    }
    // Attach the validated (type-safe) data
    (req as Request & { validatedBody: T }).validatedBody = result.data;
    next();
  };
}

/* ── Schema Definitions ──────────────────────────────────────────── */

/** Gemini chat history content part */
const contentPartSchema = z.object({
  role: z.enum(["user", "model"]),
  parts: z.array(
    z.object({
      text: z.string().max(8000, "Message too long"),
    })
  ),
});

/** POST /api/chat body */
export const chatBodySchema = z.object({
  contents: z
    .array(contentPartSchema)
    .min(1, "contents must contain at least one message")
    .max(50, "Too many messages in history"),
  systemInstruction: z.string().max(16000).optional(),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
