import { downloadAndExtractRepo } from "../utils/githubDownloader.js";
import { parseRepo } from "../utils/parser.js";
import fs from "fs/promises";

export async function detectFromGitHub(repoUrl) {
  let tempDir;
  
  try {
    // Download and extract repo to temp dir
    tempDir = await downloadAndExtractRepo(repoUrl);
    
    // Parse repo for tech stack
    const result = await parseRepo(tempDir);
    
    // Add repo metadata
    const repoMatch = repoUrl.match(/github\.com(:|\/)([^\/]+\/[^\/]+?)\.git$/);
    if (repoMatch && repoMatch[2]) {
      result.repo = repoMatch[2];
      result.url = `https://github.com/${repoMatch[2]}`;
    }
    
    return result;
  } finally {
    // Clean up temp dir
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("⚠️ Cleanup error:", cleanupErr.message);
      }
    }
  }
}