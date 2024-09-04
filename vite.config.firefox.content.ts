import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist/firefox/content-scripts",
    rollupOptions: {
      input: {
        "content-script": "src/content-script.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
