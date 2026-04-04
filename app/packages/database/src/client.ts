import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { Pool } from "pg";

import { PrismaClient } from "../generated/client/client.js";

function resolveEnvPath() {
  let currentDir = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(currentDir, ".env");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
}

config({ path: resolveEnvPath() });

declare global {
  var __vendzaPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/vendza?schema=public";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poolConfig: any = {
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
  const pool = new Pool(poolConfig);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pool as any).on("error", (err: Error) => {
    console.error("[pg] Pool error (idle client):", err.message);
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.__vendzaPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__vendzaPrisma__ = prisma;
}
