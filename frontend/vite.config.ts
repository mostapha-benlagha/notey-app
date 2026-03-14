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
      includeAssets: ["icons/notey-icon.svg", "icons/notey-icon-maskable.svg"],
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
            src: "/icons/notey-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "/icons/notey-icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
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
