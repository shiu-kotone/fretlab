/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// SPEC §2.2: base must be the GitHub Pages repository name so assets resolve
// correctly at https://<user>.github.io/fretlab/.
const REPO_BASE = '/fretlab/';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')) as { version: string };

export default defineConfig({
  base: REPO_BASE,
  define: {
    // SPEC §5.8 "アプリ情報: バージョン" — build-time constant, declared in src/vite-env.d.ts.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
