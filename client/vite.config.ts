import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { // Confifure development server to proxy API requests to the backend and competition-service. Acts like caddy in production
    port: 5173,
    proxy: {
      // 1. Spezifischer Pfad zuerst!
      "/api/competition": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/competition/, ""),
      },
      // 2. Allgemeiner Fallback danach
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});