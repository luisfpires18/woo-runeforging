import react from '@vitejs/plugin-react';
// From vitest/config, not vite: the `test` block is Vitest's, and Vite's own
// config type does not know about it.
import { defineConfig } from 'vitest/config';

// The dev server proxies /api to the ASP.NET Core process. That is why the
// backend needs no CORS configuration: to the browser, both are one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
