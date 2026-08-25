import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Base path is controlled by VITE_BASE_PATH env var:
//   GitHub Pages (staging):   VITE_BASE_PATH=/asset-tracker/
//   Firebase Hosting (prod):  VITE_BASE_PATH=/  (or unset)
// Base path uses relative './' for bulletproof GitHub Pages and subpath resolution
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
