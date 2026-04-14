import { Request, Response, NextFunction } from "express";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { auditLog } from "./audit.js";

// Lazy init Firebase Admin using env vars (no service-account file committed)
function getAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal \n so the private key works from a .env string
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n"
        ),
      }),
    });
  }
  return getAuth();
}

export interface AuthenticatedRequest extends Request {
  uid?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Attaches uid / userEmail to the request so downstream handlers can use them.
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    auditLog("AUTH_MISSING_TOKEN", { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "Unauthorized: no token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    req.userEmail = decoded.email;
    // Simple role logic: admin if email matches env var list
    const admins = (process.env.ADMIN_EMAILS || "").split(",");
    req.userRole = admins.includes(decoded.email || "") ? "admin" : "viewer";
    next();
  } catch {
    auditLog("AUTH_INVALID_TOKEN", { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

/**
 * Role guard — call after verifyToken.
 * Usage: requireRole('admin')
 */
export function requireRole(role: "admin" | "viewer") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.userRole !== role) {
      auditLog("AUTH_INSUFFICIENT_ROLE", {
        uid: req.uid,
        required: role,
        actual: req.userRole,
      });
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
