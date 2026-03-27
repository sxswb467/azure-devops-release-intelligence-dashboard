import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./db.js";
import { getDashboard, getProjects, refreshSnapshot } from "./services.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4100);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    azureMode: process.env.AZDO_PAT ? "live-configured" : "mock",
    aiMode: process.env.OPENAI_API_KEY ? "openai" : "mock"
  });
});

app.get("/api/projects", async (_req, res) => {
  res.json(await getProjects());
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const projectKey = String(req.query.project || "atlas");
    const data = await getDashboard(projectKey, {
      openAiKey: process.env.OPENAI_API_KEY,
      openAiModel: process.env.OPENAI_MODEL || "gpt-5.4-mini"
    });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/refresh", async (req, res) => {
  try {
    const result = await refreshSnapshot(String(req.body.project || "atlas"));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

await initDb();

app.listen(port, () => {
  console.log(`Release dashboard API listening on http://localhost:${port}`);
});
