import { defineConfig } from 'vite';
export default defineConfig({
  clearScreen: false,
  server: {
    port: 1437, strictPort: true, host: '127.0.0.1',
    watch: { ignored: ['**/src-tauri/**','**/docs/**','**/desktop-dist/**','**/outputs/**'] }
  },
  build: { outDir: 'desktop-dist', emptyOutDir: true },
  publicDir: 'public'
});
