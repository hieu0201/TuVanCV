import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Cho phép máy khác trong cùng mạng LAN / Wi-Fi truy cập
    allowedHosts: true, // Cho phép truy cập qua domain Cloudflare Tunnel / Ngrok
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
