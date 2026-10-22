import { defineConfig } from 'vite';
export default defineConfig({
  clearScreen: false,
  server: { port: 1437, strictPort: true, host: '127.0.0.1' },
  build: { outDir: 'desktop-dist', emptyOutDir: true },
  publicDir: 'public'
});
