import { downloadAndExtractRepo } from "../utils/githubDownloader.js";
import { parseRepo } from "../utils/parser.js";
import fs from "fs/promises";

export async function detectFromGitHub(repoUrl) {
  // Download and extract repo to temp dir
  const tempDir = await downloadAndExtractRepo(repoUrl);

  try {
    // Parse repo for tech stack
    const result = await parseRepo(tempDir);
    return result;
  } finally {
    // Clean up temp dir
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
