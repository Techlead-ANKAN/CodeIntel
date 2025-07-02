import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import readline from "readline";

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

// Helper: Stream large text files
async function processLargeFile(filePath, processor) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream });

    rl.on("line", (line) => processor(line));

    rl.on("close", resolve);
    rl.on("error", reject);
  });
}

// Category mappings
const CATEGORY_MAPPINGS = {
  frontend: {
    react: ["react", "react-dom", "next", "gatsby", "remix"],
    vue: ["vue", "nuxt", "vitepress"],
    angular: ["@angular/core"],
    svelte: ["svelte", "svelte-kit"],
    meta: ["react", "vue", "angular", "svelte"],
  },
  backend: {
    node: ["express", "koa", "nest", "fastify", "hapi"],
    python: ["django", "flask", "fastapi", "pyramid"],
    ruby: ["rails", "sinatra"],
    php: ["laravel", "symfony"],
    go: ["gin", "echo", "fiber"],
    rust: ["actix", "rocket"],
  },
  styles: [
    "tailwind",
    "bootstrap",
    "bulma",
    "material-ui",
    "antd",
    "chakra-ui",
    "styled-components",
    "sass",
    "less",
  ],
  databases: [
    "mongoose",
    "sequelize",
    "typeorm",
    "prisma",
    "sqlalchemy",
    "redis",
    "mongodb",
    "mysql",
    "postgres",
    "sqlite",
    "couchdb",
  ],
  tools: [
    "webpack",
    "vite",
    "rollup",
    "babel",
    "eslint",
    "prettier",
    "jest",
    "mocha",
    "cypress",
    "pytest",
    "rspec",
    "docker",
    "github-actions",
    "circleci",
    "travis",
  ],
};

// Framework-specific files
const FRAMEWORK_FILES = {
  next: ["next.config.js"],
  nuxt: ["nuxt.config.js"],
  gatsby: ["gatsby-config.js"],
  remix: ["remix.config.js"],
  vue: ["vue.config.js"],
  svelte: ["svelte.config.js"],
  angular: ["angular.json"],
  django: ["manage.py"],
  rails: ["Gemfile.lock"],
  laravel: ["artisan"],
  nest: ["nest-cli.json"],
};

// Main parser
export async function parseRepo(repoPath) {
  const files = await walk(repoPath);
  const result = {
    frontend: [],
    backend: [],
    styles: [],
    languages: new Set(),
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

  // First pass: Detect languages and framework files
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const filename = path.basename(file).toLowerCase();

    // Detect languages
    if (extLangMap[ext]) {
      result.languages.add(extLangMap[ext]);
    }

    // Special case: Dockerfile
    if (filename === "dockerfile") {
      result.languages.add("Docker");
    }

    // Detect framework-specific files
    for (const [framework, patterns] of Object.entries(FRAMEWORK_FILES)) {
      if (patterns.some((pattern) => filename === pattern.toLowerCase())) {
        if (!result.frameworks.includes(framework)) {
          result.frameworks.push(framework);
        }
      }
    }
  }

  // Convert Set to Array
  result.languages = [...result.languages].sort();

  // Second pass: Process package files
  for (const file of files) {
    const filename = path.basename(file).toLowerCase();

    try {
      // package.json (Node.js)
      if (filename === "package.json") {
        const pkg = await readJsonSafe(file);
        if (pkg) {
          result.details.package = pkg;

          // Combine all dependencies
          const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
            ...(pkg.peerDependencies || {}),
          };

          // Process dependencies
          for (const [dep, version] of Object.entries(allDeps)) {
            const depLower = dep.toLowerCase();

            // Frontend frameworks
            for (const [category, keywords] of Object.entries(
              CATEGORY_MAPPINGS.frontend
            )) {
              if (keywords.some((kw) => depLower.includes(kw))) {
                if (!result.frontend.includes(category)) {
                  result.frontend.push(category);
                }
              }
            }

            // Backend frameworks
            for (const [category, keywords] of Object.entries(
              CATEGORY_MAPPINGS.backend
            )) {
              if (keywords.some((kw) => depLower.includes(kw))) {
                if (!result.backend.includes(category)) {
                  result.backend.push(category);
                }
              }
            }

            // Styles
            if (
              CATEGORY_MAPPINGS.styles.some((style) => depLower.includes(style))
            ) {
              const style = CATEGORY_MAPPINGS.styles.find((style) =>
                depLower.includes(style)
              );
              if (style && !result.styles.includes(style)) {
                result.styles.push(style);
              }
            }

            // Databases
            if (
              CATEGORY_MAPPINGS.databases.some((db) => depLower.includes(db))
            ) {
              const db = CATEGORY_MAPPINGS.databases.find((db) =>
                depLower.includes(db)
              );
              if (db && !result.databases.includes(db)) {
                result.databases.push(db);
              }
            }

            // Tools
            if (
              CATEGORY_MAPPINGS.tools.some((tool) => depLower.includes(tool))
            ) {
              const tool = CATEGORY_MAPPINGS.tools.find((tool) =>
                depLower.includes(tool)
              );
              if (tool && !result.tools.includes(tool)) {
                result.tools.push(tool);
              }
            }
          }
        }
      }

      // requirements.txt (Python)
      else if (filename === "requirements.txt") {
        await processLargeFile(file, (line) => {
          const dep = line.split("=")[0].split(">")[0].split("<")[0].trim();
          if (!dep || dep.startsWith("#") || dep.startsWith("--")) return;

          const depLower = dep.toLowerCase();

          // Backend frameworks
          for (const [category, keywords] of Object.entries(
            CATEGORY_MAPPINGS.backend
          )) {
            if (keywords.some((kw) => depLower.includes(kw))) {
              if (!result.backend.includes(category)) {
                result.backend.push(category);
              }
            }
          }

          // Databases
          if (CATEGORY_MAPPINGS.databases.some((db) => depLower.includes(db))) {
            const db = CATEGORY_MAPPINGS.databases.find((db) =>
              depLower.includes(db)
            );
            if (db && !result.databases.includes(db)) {
              result.databases.push(db);
            }
          }
        });
      }

      // Gemfile (Ruby)
      else if (filename === "gemfile") {
        const content = await fs.readFile(file, "utf-8");
        result.details.gemfile = content;

        // Detect Rails
        if (content.includes("gem 'rails'")) {
          if (!result.backend.includes("ruby")) {
            result.backend.push("ruby");
          }
          if (!result.frameworks.includes("rails")) {
            result.frameworks.push("rails");
          }
        }
      }

      // composer.json (PHP)
      else if (filename === "composer.json") {
        const composer = await readJsonSafe(file);
        if (composer) {
          result.details.composer = composer;

          // Detect Laravel
          if (composer.require && composer.require["laravel/framework"]) {
            if (!result.backend.includes("php")) {
              result.backend.push("php");
            }
            if (!result.frameworks.includes("laravel")) {
              result.frameworks.push("laravel");
            }
          }
        }
      }

      // Cargo.toml (Rust)
      else if (filename === "cargo.toml") {
        const content = await fs.readFile(file, "utf-8");
        result.details.cargo = content;

        if (content.includes("[package]")) {
          if (!result.backend.includes("rust")) {
            result.backend.push("rust");
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Error processing ${file}:`, err.message);
    }
  }

  // Deduplicate and sort results
  for (const key of [
    "frontend",
    "backend",
    "styles",
    "tools",
    "frameworks",
    "databases",
    "others",
  ]) {
    result[key] = [...new Set(result[key])].sort();
  }

  return result;
}
