import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 项目站点部署在子路径（如 /momo-blog/），自托管时保持根路径。
const rawBase = process.env.PAGES_BASE || "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  base,
  root: "client",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_STATIC_DEMO": JSON.stringify(
      process.env.VITE_STATIC_DEMO ?? "",
    ),
  },
  server: {
    host: "127.0.0.1",
    port: 4317,
    strictPort: true,
    proxy: { "/api": { target: "http://127.0.0.1:4318", changeOrigin: false } },
  },
  build: { outDir: "../dist/client", emptyOutDir: true },
});
