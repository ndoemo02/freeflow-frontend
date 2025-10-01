import express from "express";
import cors from "cors";

// Vercel serverless style: export default app
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

export default app;

