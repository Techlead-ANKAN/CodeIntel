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
  backend: {
    node: ["node", "express", "koa", "nest", "fastify", "hapi"],
    django: ["django", "csrfmiddlewaretoken", "csrftoken"],
    rails: ["rails", "ruby"],
    laravel: ["laravel", "php"],
    flask: ["flask", "werkzeug"],
    aspnet: ["asp.net", "__viewstate", "__eventvalidation"],
    php: ["php", "x-powered-by: php"],
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
    sass: ["sass", "scss"],
  },
  cms: {
    wordpress: ["wp-content", "wp-includes", "wordpress", "wp-json"],
    drupal: ["drupal", "sites/all"],
    joomla: ["joomla", "media/jui"],
    shopify: ["shopify", "cdn.shopify.com"],
    magento: ["magento", "magento_version"],
  },
  databases: {
    mongodb: ["mongodb"],
    mysql: ["mysql"],
    postgres: ["postgres"],
    redis: ["redis"],
  },
  tools: {
    google_analytics: ["google-analytics", "ga.js", "gtag.js", "analytics.js"],
    google_tag_manager: ["googletagmanager", "gtm.js"],
    hotjar: ["hotjar"],
    sentry: ["sentry"],
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
    // CMS patterns
    wordpress: root.querySelector('link[href*="wp-content"]'),
    drupal: root.querySelector('link[href*="sites/default/files"]'),
    shopify: root.querySelector('link[href*="cdn.shopify.com"]'),
  };

  return Object.entries(patterns)
    .filter(([_, el]) => el)
    .map(([framework]) => framework);
}

// Enhanced CSS framework detection
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

  // Material Design detection
  if (
    classes.includes("mdl-") ||
    classes.includes("mdc-") ||
    classes.includes("mat-")
  ) {
    frameworks.push("material");
  }

  // Bulma detection
  if (classes.includes("section") && classes.includes("container")) {
    frameworks.push("bulma");
  }

  // Chakra UI detection
  if (classes.includes("css-") && classes.includes("chakra")) {
    frameworks.push("chakra");
  }

  return frameworks;
}

// Helper function to safely get header values
function getHeaderValue(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    return value.join(", ").toLowerCase();
  }
  return value ? value.toLowerCase() : "";
}

// Detect technologies from content and headers
function detectTechnologies(html, headers) {
  const result = {
    frontend: [],
    backend: [],
    styles: [],
    cms: [],
    databases: [],
    tools: [],
    security: [],
    meta: {},
  };

  const content = html.toLowerCase();
  const root = parse(html);

  // Detect framework-specific DOM patterns
  result.frontend.push(...detectFrameworkPatterns(root));

  // Detect CSS frameworks by class patterns
  result.styles.push(...detectCssFrameworks(root));

  // Detect technologies by signature patterns
  for (const [category, techs] of Object.entries(TECH_SIGNATURES)) {
    for (const [tech, signatures] of Object.entries(techs)) {
      if (signatures.some((sig) => content.includes(sig.toLowerCase()))) {
        if (!result[category].includes(tech)) {
          result[category].push(tech);
        }
      }
    }
  }

  // Get header values safely
  const serverHeader = getHeaderValue(headers, "server");
  const poweredByHeader = getHeaderValue(headers, "x-powered-by");
  const contentTypeHeader = getHeaderValue(headers, "content-type");

  // Detect backend from headers
  if (serverHeader) {
    if (serverHeader.includes("apache")) result.backend.push("apache");
    if (serverHeader.includes("nginx")) result.backend.push("nginx");
    if (serverHeader.includes("iis")) result.backend.push("iis");
    if (serverHeader.includes("cloudflare")) result.backend.push("cloudflare");
  }

  if (poweredByHeader) {
    if (poweredByHeader.includes("php")) result.backend.push("php");
    if (poweredByHeader.includes("express")) result.backend.push("node");
    if (poweredByHeader.includes("asp.net")) result.backend.push("aspnet");
    if (poweredByHeader.includes("rails")) result.backend.push("rails");
  }

  // Detect backend from content type
  if (contentTypeHeader.includes("php")) {
    result.backend.push("php");
  }

  // Detect security headers
  if (headers["strict-transport-security"]) result.security.push("hsts");
  if (headers["x-content-type-options"] === "nosniff")
    result.security.push("nosniff");
  if (headers["x-frame-options"]) result.security.push("x-frame-options");
  if (headers["x-xss-protection"]) result.security.push("xss-protection");
  if (headers["content-security-policy"]) result.security.push("csp");

  // Detect cookies for backend tech - FIXED
  if (headers["set-cookie"]) {
    let cookieHeader = headers["set-cookie"];

    // Handle both string and array formats
    if (Array.isArray(cookieHeader)) {
      cookieHeader = cookieHeader.join("; ").toLowerCase();
    } else {
      cookieHeader = cookieHeader.toLowerCase();
    }

    if (cookieHeader.includes("csrftoken")) result.backend.push("django");
    if (cookieHeader.includes("laravel_session"))
      result.backend.push("laravel");
    if (cookieHeader.includes("wordpress_logged_in"))
      result.cms.push("wordpress");
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
      validateStatus: (status) => status < 500, // Accept 4xx as valid response
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