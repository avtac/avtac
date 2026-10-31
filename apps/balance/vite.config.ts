import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

const root = resolve(__dirname, 'src');

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/react-fontawesome' // or vue-fontawesome
    ]
  },
  plugins: [react(),
  {
    name: 'remove-path-from-html',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, outputItem] of Object.entries(bundle)) {
        if (outputItem.type === 'asset' && fileName.endsWith('.html'))
          outputItem.fileName = fileName.replace('src/pages/', '');
      }
    }
  },
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico'],
    strategies: 'generateSW',
    manifest: {
      name: "Balance",
      short_name: "Balance",
      icons: [
        {
          "src": "/pwa-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "/pwa-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "/pwa-maskable-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "/pwa-maskable-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "/favicon.svg",
          "sizes": "192x192 512x512",
          "type": "image/svg+xml",
          "purpose": "any"
        }
      ],
      start_url: "/",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#FFFFFF"
    }
  })
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        config: resolve(root, 'pages/config/index.html'),
      },
      output: {
        dir: 'dist',
      }
    }
  }
})
