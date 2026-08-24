/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import solidPlugin from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), solidPlugin()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2018",
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
