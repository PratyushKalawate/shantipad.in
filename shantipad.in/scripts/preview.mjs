import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";
import { build } from "./build.mjs";

const { values } = parseArgs({ options: { port: { type: "string", default: "4174" }, base: { type: "string", default: "/" } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Use a port between 1024 and 65535.");
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(values.base)) throw new Error("Base must be / or a directory path such as /hospital/.");
const { destination } = await build();
const base = values.base;
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const address = new URL(request.url, `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(address.pathname);
    if (!pathname.startsWith(base)) throw new Error("Outside preview base");
    const relative = pathname.slice(base.length);
    if (relative.includes("\\") || relative.split("/").some(part => part.startsWith("."))) throw new Error("Invalid path");
    let file = path.resolve(destination, relative);
    if (file !== destination && !file.startsWith(`${destination}${path.sep}`)) throw new Error("Invalid path");
    if ((await stat(file)).isDirectory()) {
      if (!address.pathname.endsWith("/")) {
        response.writeHead(301, { Location: `${address.pathname}/${address.search}` }).end();
        return;
      }
      file = path.join(file, "index.html");
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Content-Length": info.size });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Page not found");
  }
});

server.on("error", error => {
  console.error(error.code === "EADDRINUSE" ? `Port ${port} is in use. Try --port ${port + 1}.` : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port}${base}`));
