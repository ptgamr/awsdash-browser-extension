import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "./xmanifests/chrome/manifest.json",
          dest: "",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist/chrome",
    rollupOptions: {
      input: {
        background: "src/background.ts",
        popup: "popup.html",
        // content-scripts are built separately because we don't want rollup to bundle them
        // Rollup enforces code-splitting when there are multiple entry-points
        // but content-scripts can't use import statements, everything need to be bundled into a single file
        // "content-scripts": "src/content-script.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
