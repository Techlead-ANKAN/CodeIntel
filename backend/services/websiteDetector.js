import axios from "axios";
import { parse } from "node-html-parser";

// Enhanced technology signatures
const TECH_SIGNATURES = {
  frontend: {
    next: [
      "__next",
      "next/router",
      "next/link",
      "next/image",
      "next/head",
      "_next/static",
      "_next/data",
    ],
    react: [
      "react",
      "react-dom",
      "react.production.min",
      "react.development",
      "reactroot",
      "createElement(",
    ],
    vue: ["vue", "vue-router", "vuex", "createApp"],
    angular: ["ng-", "angular", "@angular/core"],
    svelte: ["svelte", "svelte/internal", "svelte/store"],
    gatsby: ["gatsby", "gatsby-link"],
    nuxt: ["nuxt", "nuxt-link"],
    astro: ["astro"],
    qwik: ["qwik"],
    remix: ["remix"],
    solid: ["solid-js"],
    preact: ["preact"],
  },
  styles: {
    tailwind: [
      "tailwind",
      "tw-",
      "hover:",
      "focus:",
      "sm:",
      "md:",
      "lg:",
      "xl:",
      "2xl:",
    ],
    bootstrap: ["bootstrap", "bs-", "col-", "row", "container"],
    material: ["material-ui", "mdl-", "mdc-"],
    foundation: ["foundation", "zlide"],
    bulma: ["bulma"],
    chakra: ["chakra"],
    styled: ["styled-components"],
  },
};

// Detect framework-specific DOM patterns
function detectFrameworkPatterns(root) {
  const patterns = {
    next:
      root.querySelector("#__next") ||
      root.querySelector('script[id="__NEXT_DATA__"]'),
    gatsby: root.querySelector("#___gatsby"),
    nuxt: root.querySelector("#__nuxt"),
    angular: root.querySelector("[ng-app]"),
    vue: root.querySelector("[v-app]"),
    react:
      root.querySelector("[data-reactroot]") ||
      root.querySelector("[data-reactid]"),
    svelte: root.querySelector("[data-svelte]"),
    alpine: root.querySelector("[x-data]"),
    astro: root.querySelector("astro-island"),
  };

  return Object.entries(patterns)
    .filter(([_, el]) => el)
    .map(([framework]) => framework);
}

// Detect class patterns for CSS frameworks
function detectCssFrameworks(root) {
  const classes = root.querySelector("*")?.classList?.toString() || "";
  const frameworks = [];

  // Tailwind detection
  if (
    classes.includes("hover:") ||
    classes.includes("focus:") ||
    classes.includes("sm:") ||
    classes.includes("md:") ||
    classes.includes("lg:") ||
    classes.includes("xl:") ||
    classes.includes("2xl:")
  ) {
    frameworks.push("tailwind");
  }

  // Bootstrap detection
  if (
    classes.includes("col-") ||
    classes.includes("row") ||
    classes.includes("container") ||
    classes.includes("btn-")
  ) {
    frameworks.push("bootstrap");
  }

  return frameworks;
}

// Detect technology usage
function detectTechnologies(html, headers) {
  const result = {
    frontend: [],
    backend: [],
    styles: [],
    meta: {},
    security: [],
  };

  const content = html.toLowerCase();
  const root = parse(html);

  // Detect framework-specific DOM patterns
  result.frontend.push(...detectFrameworkPatterns(root));

  // Detect CSS frameworks by class patterns
  result.styles.push(...detectCssFrameworks(root));

  // Special detection for Next.js
  if (!result.frontend.includes("next")) {
    // Check for Next.js specific paths
    if (content.includes("_next/static") || content.includes("_next/data")) {
      result.frontend.push("next");
    }

    // Check for NextScript components
    if (html.includes("next/script")) {
      result.frontend.push("next");
    }
  }

  // Special detection for React
  if (!result.frontend.includes("react")) {
    // React component patterns
    const reactComponents = root.querySelectorAll(
      '[class*="component"], [class*="Component"]'
    );

    // React hook patterns
    const reactHooks = root.querySelectorAll(
      'script[src*="react-hooks"], script[src*="useState"]'
    );

    if (reactComponents.length > 2 || reactHooks.length > 0) {
      result.frontend.push("react");
    }
  }

  // Detect Vercel hosting
  if (headers["x-vercel-id"] || headers["server"] === "Vercel") {
    result.backend.push("vercel");
  }

  // Detect security headers
  if (headers["strict-transport-security"]) result.security.push("hsts");
  if (headers["x-content-type-options"] === "nosniff")
    result.security.push("nosniff");
  if (headers["x-frame-options"]) result.security.push("x-frame-options");
  if (headers["x-xss-protection"]) result.security.push("xss-protection");

  // Detect languages from html lang attribute
  const langAttr = root.querySelector("html")?.getAttribute("lang");
  if (langAttr) {
    result.languages = [langAttr];
  }

  return result;
}

// Main detection function
export async function detectFromWebsite(url) {
  try {
    // Normalize URL
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // Fetch website content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const html = response.data;
    const headers = response.headers;
    const techData = detectTechnologies(html, headers);

    // Parse HTML for additional metadata
    const root = parse(html);
    const metaTags = {};

    root.querySelectorAll("meta").forEach((tag) => {
      const name =
        tag.getAttribute("name") || tag.getAttribute("property") || "unknown";
      metaTags[name] = tag.getAttribute("content");
    });

    // Extract important tags
    techData.meta = {
      title: root.querySelector("title")?.textContent,
      description: metaTags.description,
      viewport: metaTags.viewport,
      charset: root.querySelector("meta[charset]")?.getAttribute("charset"),
      generator: metaTags.generator,
      themeColor: metaTags["theme-color"],
    };

    // Add website metadata
    techData.url = response.config.url;
    techData.status = response.status;
    techData.contentType = headers["content-type"];
    techData.server = headers["server"];
    techData.poweredBy = headers["x-powered-by"];

    return techData;
  } catch (error) {
    console.error("Website detection error:", error);
    throw new Error("Failed to analyze website: " + error.message);
  }
}
