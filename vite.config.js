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
      external: ['vscode', 'os', 'fs', 'path'],
    },
  },
}); 
