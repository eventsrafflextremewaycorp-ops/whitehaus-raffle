import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const API = process.env.VITE_DEV_API ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    // In development the browser talks only to Vite (same origin); Laravel is reached through this proxy,
    // so session cookies and CSRF work exactly as they will in production.
    proxy: { "/api": API, "/sanctum": API },
  },
  build: { outDir: "dist", sourcemap: false },
});
