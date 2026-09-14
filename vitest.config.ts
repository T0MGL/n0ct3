import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Mismo alias y mismos assets que el build. Solo src: los tests del backend son
// de node:test y corren con su propio runner (ver el script test).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts"],
    },
  }),
);
