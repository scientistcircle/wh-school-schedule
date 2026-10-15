import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'WH School Schedule',
        short_name: 'WH Schedule',
        description: 'School Timetable & Daily Information',
        theme_color: '#0b2545',
        background_color: '#f5f7fb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'id',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache app shell (HTML/JS/CSS/icons).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Hapus cache lama saat versi baru terpasang.
        cleanupOutdatedCaches: true,
        // Klaim klien segera setelah aktivasi.
        clientsClaim: true,
        // Jangan fallback ke index.html untuk permintaan admin API (kalau ada).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/admin/],
        runtimeCaching: [
          // Data Supabase GET — NetworkFirst, cache 24 jam.
          // POST/PATCH/DELETE tidak di-cache (Workbox hanya cache GET).
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 jam
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Font & asset statis eksternal (kalau ada).
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
        ],
      },
      devOptions: {
        // Saat development, service worker TIDAK aktif agar cache tidak menyulitkan.
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
});