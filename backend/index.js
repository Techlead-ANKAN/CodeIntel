import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { detectFromGitHub } from "./services/githubDetector.js";

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
const MAX_TIMEOUT = process.env.TIMEOUT || 120000; // 2 minutes

// Health check
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Main API Endpoint
app.get("/api/detect", async (req, res) => {
  const { repo } = req.query;
  
  // Validate URL format
  if (!repo || !/github\.com\/[^\/]+\/[^\/]+/.test(repo)) {
    return res.status(400).json({ 
      error: "Invalid GitHub URL. Format: https://github.com/owner/repo" 
    });
  }

  // Clean URL and convert to clone format
  let cleanRepoUrl = repo.trim();
  if (cleanRepoUrl.endsWith("/")) cleanRepoUrl = cleanRepoUrl.slice(0, -1);
  if (!cleanRepoUrl.endsWith(".git")) cleanRepoUrl += ".git";
  // cleanRepoUrl = cleanRepoUrl.replace("github.com", "github.com:");

  // Set timeout
  const timeout = setTimeout(() => {
    res.status(504).json({ error: "Analysis timed out. Repository might be too large." });
  }, MAX_TIMEOUT);

  try {
    const result = await detectFromGitHub(cleanRepoUrl);
    clearTimeout(timeout);
    res.json(result);
  } catch (err) {
    clearTimeout(timeout);
    console.error("❌ Detection error:", err);
    
    const status = err.message.includes("Invalid") ? 400 : 500;
    res.status(status).json({ 
      error: err.message || "Failed to analyze repository" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CodeIntel API running on http://localhost:${PORT}`);
  console.log(`⏳ Timeout set to: ${MAX_TIMEOUT/1000}s`);
});