// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { detectFromGitHub } from "./services/githubDetector.js";

// dotenv.config();
// const app = express();
// app.use(cors());

// const PORT = process.env.PORT || 3001;
// const MAX_TIMEOUT = process.env.TIMEOUT || 120000; // 2 minutes

// // Health check
// app.get("/api/ping", (req, res) => {
//   res.json({ message: "pong" });
// });

// // Main API Endpoint
// app.get("/api/detect", async (req, res) => {
//   const { repo } = req.query;

//   // Validate URL format
//   if (!repo || !/github\.com\/[^\/]+\/[^\/]+/.test(repo)) {
//     return res.status(400).json({
//       error: "Invalid GitHub URL. Format: https://github.com/owner/repo"
//     });
//   }

//   // Clean URL and convert to clone format
//   let cleanRepoUrl = repo.trim();
//   if (cleanRepoUrl.endsWith("/")) cleanRepoUrl = cleanRepoUrl.slice(0, -1);
//   if (!cleanRepoUrl.endsWith(".git")) cleanRepoUrl += ".git";
//   // cleanRepoUrl = cleanRepoUrl.replace("github.com", "github.com:");

//   // Set timeout
//   const timeout = setTimeout(() => {
//     res.status(504).json({ error: "Analysis timed out. Repository might be too large." });
//   }, MAX_TIMEOUT);

//   try {
//     const result = await detectFromGitHub(cleanRepoUrl);
//     clearTimeout(timeout);
//     res.json(result);
//   } catch (err) {
//     clearTimeout(timeout);
//     console.error("❌ Detection error:", err);

//     const status = err.message.includes("Invalid") ? 400 : 500;
//     res.status(status).json({
//       error: err.message || "Failed to analyze repository"
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 CodeIntel API running on http://localhost:${PORT}`);
//   console.log(`⏳ Timeout set to: ${MAX_TIMEOUT/1000}s`);
// });

// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { detectFromGitHub } from "./services/githubDetector.js";
// import { detectFromWebsite } from "./services/websiteDetector.js"; // NEW

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json()); // NEW: For POST requests

// const PORT = process.env.PORT || 3001;
// const MAX_TIMEOUT = process.env.TIMEOUT || 120000; // 2 minutes

// // Health check
// app.get("/api/ping", (req, res) => {
//   res.json({ message: "pong" });
// });

// // GitHub Repo Analysis Endpoint
// app.get("/api/detect", async (req, res) => {
//   const { repo } = req.query;

//   // Validate URL format
//   if (!repo || !/github\.com\/[^\/]+\/[^\/]+/.test(repo)) {
//     return res.status(400).json({
//       error: "Invalid GitHub URL. Format: https://github.com/owner/repo",
//     });
//   }

//   // Clean URL and convert to clone format
//   let cleanRepoUrl = repo.trim();
//   if (cleanRepoUrl.endsWith("/")) cleanRepoUrl = cleanRepoUrl.slice(0, -1);
//   if (!cleanRepoUrl.endsWith(".git")) cleanRepoUrl += ".git";

//   // Set timeout
//   const timeout = setTimeout(() => {
//     res
//       .status(504)
//       .json({ error: "Analysis timed out. Repository might be too large." });
//   }, MAX_TIMEOUT);

//   try {
//     const result = await detectFromGitHub(cleanRepoUrl);
//     clearTimeout(timeout);
//     res.json(result);
//   } catch (err) {
//     clearTimeout(timeout);
//     console.error("❌ Detection error:", err);

//     const status = err.message.includes("Invalid") ? 400 : 500;
//     res.status(status).json({
//       error: err.message || "Failed to analyze repository",
//     });
//   }
// });

// // NEW: Website Analysis Endpoint
// app.post("/api/detect-website", async (req, res) => {
//   const { url } = req.body;

//   if (!url) {
//     return res.status(400).json({
//       error: "Missing website URL in request body",
//     });
//   }

//   // Set timeout
//   const timeout = setTimeout(() => {
//     res.status(504).json({ error: "Website analysis timed out." });
//   }, 15000); // Shorter timeout for websites

//   try {
//     const result = await detectFromWebsite(url);
//     clearTimeout(timeout);
//     res.json(result);
//   } catch (err) {
//     clearTimeout(timeout);
//     console.error("❌ Website detection error:", err);
//     res.status(500).json({
//       error: err.message || "Failed to analyze website",
//     });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 CodeIntel API running on http://localhost:${PORT}`);
//   console.log(`⏳ Timeout set to: ${MAX_TIMEOUT / 1000}s`);
//   console.log(`🌐 Added website analysis endpoint: POST /api/detect-website`);
// });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { detectFromGitHub } from "./services/githubDetector.js";
import { detectFromWebsite } from "./services/websiteDetector.js"; // NEW

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); // NEW: For POST requests

const PORT = process.env.PORT || 3001;
const MAX_TIMEOUT = process.env.TIMEOUT || 120000; // 2 minutes

// Health check
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

// GitHub Repo Analysis Endpoint
app.get("/api/detect", async (req, res) => {
  const { repo } = req.query;

  // Validate URL format
  if (!repo || !/github\.com\/[^\/]+\/[^\/]+/.test(repo)) {
    return res.status(400).json({
      error: "Invalid GitHub URL. Format: https://github.com/owner/repo",
    });
  }

  // Clean URL and convert to clone format
  let cleanRepoUrl = repo.trim();
  if (cleanRepoUrl.endsWith("/")) cleanRepoUrl = cleanRepoUrl.slice(0, -1);
  if (!cleanRepoUrl.endsWith(".git")) cleanRepoUrl += ".git";

  // Set timeout
  const timeout = setTimeout(() => {
    res
      .status(504)
      .json({ error: "Analysis timed out. Repository might be too large." });
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
      error: err.message || "Failed to analyze repository",
    });
  }
});

// NEW: Website Analysis Endpoint (improved)
app.post("/api/detect-website", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "Missing website URL in request body",
    });
  }

  // Set timeout
  const timeout = setTimeout(() => {
    res.status(504).json({ error: "Website analysis timed out." });
  }, 15000); // Shorter timeout for websites

  try {
    const result = await detectFromWebsite(url);
    clearTimeout(timeout);
    res.json(result);
  } catch (err) {
    clearTimeout(timeout);
    console.error("❌ Website detection error:", err);
    res.status(500).json({
      error: err.message || "Failed to analyze website",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CodeIntel API running on http://localhost:${PORT}`);
  console.log(`⏳ Timeout set to: ${MAX_TIMEOUT / 1000}s`);
  console.log(`🌐 Added website analysis endpoint: POST /api/detect-website`);
});
