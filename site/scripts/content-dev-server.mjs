import { createReadStream, existsSync } from "fs";
import { promises as fs } from "fs";
import http from "http";
import path from "path";

const HOST = process.env.CONTENT_DEV_HOST ?? "127.0.0.1";
const PORT = Number(process.env.CONTENT_DEV_PORT ?? 4310);
const ROOT = path.join(process.cwd(), "public");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(root, requestPath) {
  const cleanPath = requestPath.split("?")[0].split("#")[0];
  const resolved = path.resolve(root, `.${cleanPath}`);
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    send(res, 400, "Bad Request");
    return;
  }

  const filePath = safeJoin(ROOT, req.url);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const stats = await fs.stat(filePath);
    const targetPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;

    if (!existsSync(targetPath)) {
      send(res, 404, "Not Found");
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
    });
    createReadStream(targetPath).pipe(res);
  } catch {
    send(res, 404, "Not Found");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`content-dev-server listening on http://${HOST}:${PORT}`);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
});
