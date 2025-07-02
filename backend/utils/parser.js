import fs from "fs/promises";
import path from "path";

// Helper: Recursively walk directory and collect files
async function walk(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Helper: Read JSON file safely
async function readJsonSafe(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Main parser
export async function parseRepo(repoPath) {
  const files = await walk(repoPath);
  const result = {
    frontend: [],
    backend: [],
    styles: [],
    languages: [],
    tools: [],
    frameworks: [],
    databases: [],
    others: [],
    details: {},
  };

  // Language/file extension mapping
  const extLangMap = {
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".py": "Python",
    ".java": "Java",
    ".rb": "Ruby",
    ".go": "Go",
    ".php": "PHP",
    ".cs": "C#",
    ".cpp": "C++",
    ".c": "C",
    ".rs": "Rust",
    ".kt": "Kotlin",
    ".swift": "Swift",
    ".dart": "Dart",
    ".css": "CSS",
    ".scss": "SCSS",
    ".less": "LESS",
    ".html": "HTML",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".json": "JSON",
    ".md": "Markdown",
    ".sh": "Shell",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".dockerfile": "Docker",
  };

  // Framework/library detection by keywords
  const frontendLibs = [
    "react",
    "vue",
    "angular",
    "svelte",
    "next",
    "nuxt",
    "vite",
    "gatsby",
    "remix",
  ];
  const backendLibs = [
    "express",
    "koa",
    "fastify",
    "nestjs",
    "django",
    "flask",
    "rails",
    "spring",
    "laravel",
    "gin",
    "fiber",
    "actix",
  ];
  const styleLibs = [
    "tailwindcss",
    "bootstrap",
    "bulma",
    "material-ui",
    "antd",
    "chakra-ui",
    "semantic-ui",
    "foundation",
  ];
  const dbLibs = [
    "mongoose",
    "pg",
    "mysql",
    "sqlite",
    "typeorm",
    "prisma",
    "sequelize",
    "redis",
    "mongodb",
  ];
  const toolLibs = [
    "eslint",
    "prettier",
    "webpack",
    "babel",
    "rollup",
    "parcel",
    "gulp",
    "grunt",
    "husky",
    "jest",
    "mocha",
    "cypress",
  ];

  // Scan files
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (extLangMap[ext] && !result.languages.includes(extLangMap[ext])) {
      result.languages.push(extLangMap[ext]);
    }

    // Special case: Dockerfile
    if (
      path.basename(file).toLowerCase() === "dockerfile" &&
      !result.languages.includes("Docker")
    ) {
      result.languages.push("Docker");
    }

    // package.json (Node.js, frontend, tools, etc.)
    if (file.endsWith("package.json")) {
      const pkg = await readJsonSafe(file);
      if (pkg) {
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        };
        for (const dep in allDeps) {
          const depLower = dep.toLowerCase();

          // Only add to backend if it matches backendLibs and does NOT match frontendLibs
          if (
            backendLibs.some((b) => depLower === b) &&
            !frontendLibs.some((f) => depLower.includes(f)) &&
            !result.backend.includes(dep)
          ) {
            result.backend.push(dep);
          }

          // Frontend detection
          if (
            frontendLibs.some((f) => depLower.includes(f)) &&
            !result.frontend.includes(dep)
          ) {
            result.frontend.push(dep);
          }

          // Styles
          if (
            styleLibs.some((s) => depLower.includes(s)) &&
            !result.styles.includes(dep)
          ) {
            result.styles.push(dep);
          }

          // Databases
          if (
            dbLibs.some((d) => depLower.includes(d)) &&
            !result.databases.includes(dep)
          ) {
            result.databases.push(dep);
          }

          // Tools
          if (
            toolLibs.some((t) => depLower.includes(t)) &&
            !result.tools.includes(dep)
          ) {
            result.tools.push(dep);
          }
        }
        result.details["package.json"] = pkg;
      }
    }

    // requirements.txt (Python)
    if (file.endsWith("requirements.txt")) {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n").map((l) => l.trim().toLowerCase());
      for (const line of lines) {
        // Only add to backend if it matches backendLibs and does NOT match frontendLibs
        if (
          backendLibs.some((b) => line === b) &&
          !frontendLibs.some((f) => line.includes(f)) &&
          !result.backend.includes(line)
        ) {
          result.backend.push(line);
        }
        if (
          dbLibs.some((d) => line.includes(d)) &&
          !result.databases.includes(line)
        ) {
          result.databases.push(line);
        }
        if (
          toolLibs.some((t) => line.includes(t)) &&
          !result.tools.includes(line)
        ) {
          result.tools.push(line);
        }
      }
      result.details["requirements.txt"] = lines;
    }

    // pyproject.toml (Python)
    if (file.endsWith("pyproject.toml")) {
      const content = await fs.readFile(file, "utf-8");
      result.details["pyproject.toml"] = content;
    }

    // Gemfile (Ruby)
    if (file.endsWith("Gemfile")) {
      const content = await fs.readFile(file, "utf-8");
      result.details["Gemfile"] = content;
    }

    // composer.json (PHP)
    if (file.endsWith("composer.json")) {
      const composer = await readJsonSafe(file);
      if (composer) {
        result.details["composer.json"] = composer;
      }
    }

    // go.mod (Go)
    if (file.endsWith("go.mod")) {
      const content = await fs.readFile(file, "utf-8");
      result.details["go.mod"] = content;
    }

    // pubspec.yaml (Dart/Flutter)
    if (file.endsWith("pubspec.yaml")) {
      const content = await fs.readFile(file, "utf-8");
      result.details["pubspec.yaml"] = content;
    }
  }

  // Deduplicate and sort
  for (const key of [
    "frontend",
    "backend",
    "styles",
    "languages",
    "tools",
    "frameworks",
    "databases",
    "others",
  ]) {
    result[key] = Array.from(new Set(result[key])).sort();
  }

  return result;
}
