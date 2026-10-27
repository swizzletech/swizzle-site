// The Swizzle landing page: static HTML at build time, small client scripts for the motion.
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Canonical URLs, Open Graph and the sitemap need the public origin, so a production build must name it:
// SITE_URL=https://… npm run build. BASE_PATH is the subpath when the site is not served from the root
// (github.io/swizzle-site before the own domain is connected); the deploy workflow sets both from GitHub Pages.
const site = process.env.SITE_URL;
const base = process.env.BASE_PATH || "/";
if (!site && process.argv.includes("build")) throw new Error("Set SITE_URL to the site's public origin for a build.");

export default defineConfig({
  site,
  base,
  integrations: site ? [sitemap()] : [],
  // the dev server is reviewed from other machines over Tailscale (*.ts.net)
  server: { host: "0.0.0.0", port: 4321, allowedHosts: [".ts.net"] },
  devToolbar: { enabled: false },
});
