import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site works at a domain root or in a subfolder.
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
