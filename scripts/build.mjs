import { execSync } from "node:child_process";

const mode = (process.argv[2] || "uat").trim().toLowerCase();

execSync(`vite build --mode ${mode}`, { stdio: "inherit", env: process.env });
