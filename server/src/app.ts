import express, { type Express } from "express";
import cors from "cors";

/** Build the Express app. Kept separate from server start-up so tests can import it. */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
