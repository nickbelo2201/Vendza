#!/usr/bin/env node
/**
 * Prisma 7 gera arquivos .ts com imports sem extensão (ex: from './enums').
 * Node.js ESM exige extensões explícitas. Este script adiciona .js a todos
 * os imports relativos sem extensão nos arquivos gerados.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = join(__dirname, "../generated");

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

async function fixImports(filePath) {
  let content = await readFile(filePath, "utf-8");
  const original = content;

  // Adiciona .js a imports/exports relativos sem extensão
  // Padrão: from './foo' ou from "../foo" onde foo não tem extensão
  content = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, path, suffix) => {
      if (extname(path) !== "") return match; // já tem extensão
      return `${prefix}${path}.js${suffix}`;
    }
  );

  if (content !== original) {
    await writeFile(filePath, content, "utf-8");
    console.log(`  fixed: ${filePath.replace(join(__dirname, ".."), "")}`);
  }
}

async function main() {
  console.log("Fixing extensionless imports in generated Prisma client...");
  const files = await walkDir(GENERATED_DIR);
  await Promise.all(files.map(fixImports));
  console.log(`Done. Processed ${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
