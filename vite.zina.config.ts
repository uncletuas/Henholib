import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Build config for Zina — the control plane at zina.loopital.com.
 *
 * A second app in the same repo rather than a second repo: Zina and the
 * marketing site share an API, a dependency tree and a release, and splitting
 * them would mean two node_modules and two chances for the API client to drift.
 * It builds to its own `dist-zina`, so Render serves it as its own static site
 * with its own domain.
 *
 *   npm run dev:zina     — local, against VITE_API_BASE_URL
 *   npm run build:zina   — production bundle in dist-zina/
 */
export default defineConfig({
  root: path.resolve(__dirname, 'zina'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './zina/src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-zina'),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
})
