import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths so the built site works from a GitHub Pages subfolder.
  base: "./",
  // The 2,000-word list makes the bundle ~525 KB (~150 KB compressed), which is fine.
  build: { chunkSizeWarningLimit: 1000 },
});
