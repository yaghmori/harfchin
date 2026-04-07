/**
 * Loads `.env` then `.env.local` (local overrides), then runs `pnpm exec prisma …`.
 *
 * Prisma CLI only auto-loads `.env`; Next.js uses `.env.local` for secrets.
 *
 * Windows EPERM on `query_engine-windows.dll.node`: another process has the file
 * open (often `pnpm dev`). Stop the dev server, then run `pnpm db:generate` again.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const name of [".env", ".env.local"]) {
  const path = resolve(root, name);
  if (existsSync(path)) {
    config({ path, override: name === ".env.local" });
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/prisma-with-env.mjs <prisma-args…>");
  process.exit(1);
}

const child = spawn("pnpm", ["exec", "prisma", ...args], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
