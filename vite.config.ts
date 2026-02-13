
import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths to ensure the app works on GitHub Pages subdirectories
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});
