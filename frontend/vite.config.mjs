// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Load path aliases from tsconfig.json, which is the frontend source of truth.
// ---------------------------------------------------------------------------
const tsconfigPath = path.resolve(__dirname, "tsconfig.json");
let alias = {};
if (fs.existsSync(tsconfigPath)) {
  try {
    const parsedConfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    const paths = parsedConfig.compilerOptions?.paths || {};
    for (const [pattern, targets] of Object.entries(paths)) {
      const cleanKey = pattern.replace(/\/\*$/, "");
      const target = targets[0].replace(/\/\*$/, "");
      alias[cleanKey] = path.resolve(__dirname, target);
    }
  } catch (e) {
    console.warn(`Failed to parse ${path.basename(tsconfigPath)} for Vite aliasing:`, e);
  }
}

export default defineConfig(({ mode }) => {
  const proxyTarget = `http://localhost:${process.env.PORT || 5000}`;
  const devHost = process.env.VITE_HOST || "127.0.0.1";
  const devPort = Number(process.env.VITE_PORT || 5173);
  console.log(`[Vite Config] Proxying /api to ${proxyTarget}`);
  return {
    plugins: [react()],
    resolve: { alias },
    server: {
      host: devHost,
      port: devPort,
      // Proxy API calls to the Express backend (running on PORT)
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${process.env.PORT || 5000}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: devHost,
      port: devPort,
    },
  };
});
