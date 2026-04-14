import { defineConfig } from "vite";

const isMinify = process.env.MINIFY === "true";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "FlowPilot",
      formats: ["umd", "es"],
      fileName: (format) => {
        const suffix = isMinify ? ".min" : "";
        return format === "es"
          ? `flowpilot.esm${suffix}.js`
          : `flowpilot.umd${suffix}.js`;
      },
    },
    outDir: process.env.FLOWPILOT_OUT_DIR || "dist",
    emptyOutDir: false,
    minify: isMinify ? "terser" : false,
  },
});
