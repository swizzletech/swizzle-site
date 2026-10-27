// Prefixes a site path with the deploy base ("/" on the own domain, "/swizzle-site/" on github.io).
export const path = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, "") + "/" + p.replace(/^\//, "");
