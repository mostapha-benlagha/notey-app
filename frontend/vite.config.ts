import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/notey-app-icon.ico", "icons/notey-app-icon.png"],
      manifest: {
        name: "Notey",
        short_name: "Notey",
        description: "A chat-first note and task workspace.",
        theme_color: "#1663c7",
        background_color: "#fdfaf5",
        display: "standalone",
        scope: "/",
        start_url: "/app",
        icons: [
          {
            src: "/icons/notey-app-icon.png",
            sizes: "1024x1024",
            type: "image/png",
          },
          {
            src: "/icons/notey-app-icon.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
