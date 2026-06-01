import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { ok } from "./lib/apiResponse.js";
import { authRouter } from "./routes/auth.js";
import { ideasRouter } from "./routes/ideas.js";
import { pointsRouter } from "./routes/points.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => ok(res, { status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/ideas", ideasRouter);
  app.use("/api/points", pointsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
