import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "cart",
      filename: "remoteEntry.js",
      exposes: {
        "./CartApp": "./src/CartApp.tsx"
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true }
      }
    })
  ],
  server: {
    origin: "http://localhost:5175",
    port: 5175
  },
  base: "http://localhost:5175/",
  build: {
    target: "chrome89"
  }
});
