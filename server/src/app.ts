import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";

/** Build the Express app. Kept separate from server start-up so tests can import it. */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);

  // Centralized error handler — keeps unexpected errors from leaking internals.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
