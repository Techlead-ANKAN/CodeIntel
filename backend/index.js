import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { detectFromGitHub } from "./services/githubDetector.js";

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// Health check
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Main API Endpoint
app.get("/api/detect", async (req, res) => {
  const { repo } = req.query;
  if (!repo || !repo.includes("github.com")) {
    return res
      .status(400)
      .json({ error: "Invalid or missing GitHub repo URL." });
  }

  try {
    const result = await detectFromGitHub(repo);
    res.json(result);
  } catch (err) {
    console.error("❌ Detection error:", err);
    res.status(500).json({ error: "Failed to analyze repository." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CodeIntel API running on http://localhost:${PORT}`);
});
