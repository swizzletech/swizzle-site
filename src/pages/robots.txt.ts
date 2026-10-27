// robots.txt, generated so the sitemap line carries the deployed origin and base.
import type { APIRoute } from "astro";
import { path } from "../path";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL(path("/sitemap-index.xml"), site).href}\n` : ""}`);
