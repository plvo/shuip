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
  minify: false,
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


// export default defineConfig({
//   entry: ['src/index.ts'],
//   format: ['esm'],
//   dts: true, // Génère les fichiers .d.ts
//   splitting: false, // Désactiver le code splitting pour éviter des incompatibilités
//   sourcemap: true, // Facilite le débogage
//   clean: true, // Nettoie le dossier dist avant build
//   treeshake: true, // Supprime le code inutilisé
//   minify: false, // Laisser minify désactivé pour le moment
//   target: 'node18', // Version cible de Node.js
//   platform: 'node', // Indique que c'est pour un environnement Node.js
// });