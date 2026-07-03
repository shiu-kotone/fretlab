/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// SPEC §2.2: base must be the GitHub Pages repository name so assets resolve
// correctly at https://<user>.github.io/fretlab/.
const REPO_BASE = '/fretlab/';

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FretLab',
        short_name: 'FretLab',
        description: 'ギター練習オールインワンPWA',
        start_url: REPO_BASE,
        scope: REPO_BASE,
        display: 'standalone',
        background_color: '#16130F',
        theme_color: '#16130F',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
