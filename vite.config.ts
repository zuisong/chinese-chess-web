/// <reference types="vitest/config" />

import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [preact(), tailwindcss()],
  build: {
    outDir: "docs",
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
