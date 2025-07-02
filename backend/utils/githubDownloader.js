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

  // Use git clone for simplicity (can add zip download fallback if needed)
  const repoName = repoUrl.split("/").pop().replace(/\.git$/, "");
  const cloneCmd = `git clone --depth=1 ${repoUrl} "${tempDir}"`;

  try {
    await execAsync(cloneCmd, { timeout: 60000 });
    return tempDir;
  } catch (err) {
    throw new Error("Failed to clone repository: " + err.message);
  }
}