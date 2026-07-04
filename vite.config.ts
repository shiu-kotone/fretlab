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
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FretLab — ギター練習オールインワン',
        short_name: 'FretLab',
        description: '指板演奏・コードライブラリ・コード進行・メトロノーム・チューナー・録音・練習記録を1つにまとめたギター練習PWA',
        lang: 'ja',
        start_url: REPO_BASE,
        scope: REPO_BASE,
        display: 'standalone',
        background_color: '#16130F',
        theme_color: '#16130F',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
