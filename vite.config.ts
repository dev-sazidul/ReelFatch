import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { lookupLogPlugin } from './vite.lookup-log';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), lookupLogPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api/health': { target: process.env.VITE_DEV_API_PROXY ?? 'http://127.0.0.1:3000', changeOrigin: true },
      '/api/videos': { target: process.env.VITE_DEV_API_PROXY ?? 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});
