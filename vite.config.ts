import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/Easy-Work/',   // 注意：这里是你的仓库名 Easy-Work
  build: {
    // Vite 8 默认 lightningcss 会错误压缩 backdrop-filter，导致毛玻璃失效
    cssMinify: 'esbuild',
  },
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
