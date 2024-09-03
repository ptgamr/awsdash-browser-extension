import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "./xmanifests/firefox/manifest.json",
          dest: "",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist/firefox",
    rollupOptions: {
      input: {
        background: "src/background.ts",
        "content-script": "src/content-script.ts",
        popup: "popup.html",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
