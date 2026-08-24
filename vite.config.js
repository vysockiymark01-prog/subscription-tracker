import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/subscription-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Регистрируем service worker вручную (main.jsx) — так можно принудительно
      // проверять обновления сразу и периодически, а не полагаться на то, что
      // браузер сам решит проверить (по умолчанию это может не происходить сутками,
      // из-за чего новые версии не доходили до пользователей после деплоя).
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Трекер подписок',
        short_name: 'Подписки',
        description: 'Учёт платных подписок и напоминания о списаниях. Все данные хранятся локально.',
        lang: 'ru',
        theme_color: '#6C5CE7',
        background_color: '#0F0F14',
        display: 'standalone',
        orientation: 'portrait',
        id: '/subscription-tracker/',
        start_url: '/subscription-tracker/',
        scope: '/subscription-tracker/',
        categories: ['finance', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Добавить подписку',
            short_name: 'Добавить',
            url: '/subscription-tracker/?action=add',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Календарь платежей',
            short_name: 'Календарь',
            url: '/subscription-tracker/?screen=calendar',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
