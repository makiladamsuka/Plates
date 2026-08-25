import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg'],
      manifest: {
        name: 'Plates',
        short_name: 'Plates',
        description: 'Eat together. Settle later.',
        theme_color: '#EDEDF1',
        background_color: '#EDEDF1',
        display: 'standalone',
        icons: [
          {
            src: 'logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      // Proxy /api requests to local Express backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
