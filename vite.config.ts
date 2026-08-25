import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // fallback
}

const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform-git-commit',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>\n  <meta name="git-commit" content="${commitHash}" />\n  <meta name="build-time" content="${buildTime}" />`
        );
      },
    },
  ],
  base: './',
  define: {
    __APP_GIT_COMMIT__: JSON.stringify(commitHash),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
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

