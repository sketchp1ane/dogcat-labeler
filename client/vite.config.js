import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 所有以 /api 开头的请求都会转发到后端 3000 端口
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // 可选：支持静态资源也从后端拿（如 /uploads/...）
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
