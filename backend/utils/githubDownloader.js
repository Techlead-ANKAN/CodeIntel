import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export async function downloadAndExtractRepo(repoUrl) {
  const tempDir = path.join(os.tmpdir(), "codeintel-" + uuidv4());
  await fs.mkdir(tempDir, { recursive: true });

  // Extract repo name from URL
  const repoMatch = repoUrl.match(/github\.com[:\/]([^\/]+\/[^\/]+?)(\.git)?$/);
  if (!repoMatch || !repoMatch[1]) {
    throw new Error("Invalid GitHub repository URL format");
  }

  const repoName = repoMatch[1];
  const cloneUrl = `https://github.com/${repoName}.git`;
  const cloneCmd = `git clone --depth=1 ${cloneUrl} "${tempDir}"`;

  try {
    await execAsync(cloneCmd, { timeout: 90000 }); // 90 seconds timeout
    return tempDir;
  } catch (err) {
    // Cleanup on failure
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    console.error("GIT ERROR:", err.stderr || err.message);

    if (err.code === 128) {
      throw new Error("Repository not found or access denied");
    } else if (err.killed) {
      throw new Error("Clone operation timed out");
    } else {
      throw new Error(
        "Failed to clone repository: " + (err.stderr || err.message)
      );
    }
  }
}
