import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFileName = (process.env.ENV_FILE || ".env").trim();
const envPath = path.join(__dirname, envFileName);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`[CMS] Loaded env file: ${envFileName}`);
} else {
  dotenv.config();
  console.log("[CMS] Loaded env file: .env (default)");
}

// USE_HTTP_ONLY=true trong .env.pro → HTTP :4021 (Nginx proxy). Còn lại → HTTPS.
const useHttps = process.env.USE_HTTP_ONLY !== "true";

const HTTPS_PORT = parseInt(process.env.WEB_PORT, 10) || 4020;
const HTTP_PORT = parseInt(process.env.HTTP_PORT, 10) || 4021;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "certs", "server.key");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "certs", "server.crt");
const DIST_DIR = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

if (!fs.existsSync(DIST_INDEX)) {
  console.error("[CMS] dist/ chưa có — chạy build trước khi start server:");
  console.error("  npm run buildpro   (production)");
  console.error("  npm run build      (uat)");
  process.exit(1);
}

console.log(
  `[CMS] NODE_ENV=${process.env.NODE_ENV || ""} ENV_FILE=${envFileName} mode=${useHttps ? "https" : "http-only"}`,
);

const app = express();
app.use(
  "/assets",
  express.static(path.join(DIST_DIR, "assets"), {
    maxAge: "1y",
    immutable: true,
    fallthrough: false,
  }),
);
app.use(express.static(DIST_DIR, { maxAge: 0, index: false }));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

const ensureCertificates = () => {
  if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
    console.error("HTTPS certificate files not found.");
    console.error("Expected files:");
    console.error(`  SSL_KEY_PATH=${SSL_KEY_PATH}`);
    console.error(`  SSL_CERT_PATH=${SSL_CERT_PATH}`);
    console.error("Create them with:");
    console.error("  mkdir -p certs");
    console.error(
      "  openssl req -x509 -newkey rsa:4096 -nodes -keyout certs/server.key -out certs/server.crt -days 365 -subj '/CN=localhost'",
    );
    process.exit(1);
  }
};

if (!useHttps) {
  http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`Server running at http://127.0.0.1:${HTTP_PORT} (behind reverse proxy)`);
  });
} else {
  ensureCertificates();

  const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };

  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`Server running at https://localhost:${HTTPS_PORT}`);
  });

  http.createServer((req, res) => {
    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
    const destination = `https://${host}:${HTTPS_PORT}${req.url}`;
    res.writeHead(301, { Location: destination });
    res.end();
  }).listen(HTTP_PORT, () => {
    console.log(`Redirecting http://localhost:${HTTP_PORT} -> https://localhost:${HTTPS_PORT}`);
  });
}
