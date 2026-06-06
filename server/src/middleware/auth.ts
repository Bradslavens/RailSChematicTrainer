import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../domain/auth.js";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

export function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/** Require a valid Bearer token; attaches req.user. Responds 401 otherwise. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    req.user = verifyToken(header.slice("Bearer ".length), getSecret());
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Require an authenticated admin. Use after requireAuth. Responds 403 otherwise. */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
