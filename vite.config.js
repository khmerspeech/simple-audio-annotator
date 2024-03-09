import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: {
    },
    API_BASE_URL: process.env.NODE_ENV === "production" ? "location" : JSON.stringify("http://127.0.0.1:8000")
  },
})
