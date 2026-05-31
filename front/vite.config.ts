import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/store/**', 'src/components/client/**', 'src/features/client/**'],
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/assets': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
