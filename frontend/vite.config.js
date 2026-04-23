import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'MERN Chat & Notes',
        short_name: 'ChatNotes',
        description: 'A private chat and notes app for two users',
        theme_color: '#ffffff',
        icons: []
      }
    })
  ]
})
