import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Điều Tra Hiện Trường VKU',
        short_name: 'Điều Tra HT',
        description: 'Ứng dụng phỏng vấn khảo sát bạo lực học đường, hoạt động offline',
        theme_color: '#0f6e56',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // Cache toàn bộ app shell (html/css/js/icon) để mở được khi offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Ảnh chụp trong form là base64/blob nên không qua network,
            // rule này chỉ áp dụng nếu sau này bạn gọi ảnh từ server
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images-cache' }
          },
          {
            // Nếu sau này có API thật, network-first + fallback cache
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 }
          }
        ]
      },
      devOptions: {
        enabled: true // cho phép test PWA/service worker ngay ở chế độ dev
      }
    })
  ]
})
