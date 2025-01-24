import { defineConfig } from "tsup";

// export default defineConfig({
//   clean: true,
//   dts: false,
//   entry: ["src/index.ts"],
//   format: ["esm"],
//   sourcemap: true,
//   minify: true,
//   target: "esnext",
//   outDir: "dist",
// });

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: true,
  external: [
    /^node:/,
    'path',
    'fs',
    'url',
  ],
  platform: 'node',
  target: 'node18',
  outDir: "dist",
});