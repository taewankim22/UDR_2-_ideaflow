import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  aiMode: process.env.AI_MODE ?? "mock",
  geminiApiKey: process.env.GEMINI_API_KEY ?? ""
};
