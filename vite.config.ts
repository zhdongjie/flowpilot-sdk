import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "FlowPilot",
      formats: ["umd", "es"],
      fileName: (format) =>
        format === "es" ? "flowpilot.esm.js" : "flowpilot.umd.js",
    },
    outDir: process.env.FLOWPILOT_OUT_DIR || "dist",
    emptyOutDir: true,
  },
});
