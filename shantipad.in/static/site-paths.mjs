import { safeUrl } from "./ui-utils.mjs";

// Resolve from the script, not the current page: deep links share one site root.
export function siteRoot(scriptUrl) {
  return new URL("../", scriptUrl);
}

export function pagePath(pathname, root) {
  const base = new URL(root).pathname;
  if (!pathname.startsWith(base)) return "/";
  return `/${pathname.slice(base.length)}`.replace(/index\.html$/, "").replace(/\/?$/, "/");
}

export function routeHref(route, root) {
  if (route.startsWith("#")) return route;
  return new URL(route.replace(/^\/+/, ""), root).pathname;
}

export function assetHref(value, root) {
  if (typeof value !== "string" || !value.trim()) return "";
  // Accept legacy /static/... paths without escaping a repository subdirectory.
  const path = value.startsWith("/") && !value.startsWith("//") ? value.slice(1) : value;
  try {
    return safeUrl(new URL(path, root).href, new URL(root).origin);
  } catch {
    return "";
  }
}
