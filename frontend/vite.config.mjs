// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Load path aliases from jsconfig.json (if present) to keep existing imports
// ---------------------------------------------------------------------------
const jsconfigPath = path.resolve(__dirname, "jsconfig.json");
let alias = {};
if (fs.existsSync(jsconfigPath)) {
  try {
    const jsconfig = JSON.parse(fs.readFileSync(jsconfigPath, "utf-8"));
    const paths = jsconfig.compilerOptions?.paths || {};
    for (const [pattern, targets] of Object.entries(paths)) {
      const cleanKey = pattern.replace(/\/\*$/, "");
      const target = targets[0].replace(/\/\*$/, "");
      alias[cleanKey] = path.resolve(__dirname, target);
    }
  } catch (e) {
    console.warn("Failed to parse jsconfig.json for Vite aliasing:", e);
  }
}

export default defineConfig(({ mode }) => {
  const proxyTarget = `http://localhost:${process.env.PORT || 5000}`;
  console.log(`[Vite Config] Proxying /api to ${proxyTarget}`);
  return {
    plugins: [react()],
    resolve: { alias },
    server: {
      port: Number(process.env.VITE_PORT || 5173),
      // Proxy API calls to the Express backend (running on PORT)
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${process.env.PORT || 5000}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
