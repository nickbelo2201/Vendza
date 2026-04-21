import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Isola cada suite para evitar vazamento de mocks entre arquivos
    isolate: true,
    // Necessário para ESM com TypeScript
    pool: "forks",
  },
  resolve: {
    alias: {
      // Permite importar "@vendza/database" sem build real nos testes
      "@vendza/database": path.resolve(
        __dirname,
        "../../packages/database/generated/client/index.js",
      ),
    },
  },
});
