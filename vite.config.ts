import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/camino-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Camino Companion',
        short_name: 'Camino',
        description: 'Route map and GPS progress for walking the Camino de Santiago',
        theme_color: '#2d6a4f',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/camino-app/',
        scope: '/camino-app/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + bundled route/POI data are precached. Map tiles are
        // handled separately in IndexedDB via the explicit download flow,
        // not through the service worker's runtime cache (iOS evicts
        // Cache Storage far more aggressively than IndexedDB).
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
