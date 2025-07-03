import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/extension.ts',
      formats: ['cjs'],
      fileName: 'extension',
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['vscode', 'os', 'fs', 'path', 'node:path', 'node:fs', 'node:util', 'util', 'stream', 'events'],
      output: {
        compact: true,
        minifyInternalExports: true
      }
    },
    minify: 'esbuild',
    chunkSizeWarningLimit: 5000,
  },
}); 
