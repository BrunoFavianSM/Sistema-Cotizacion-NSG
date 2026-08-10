import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  // Seguridad del build de producción:
  // - sourcemap: false → no se puede reconstruir el código fuente original
  // - minify → código ilegible para inspección casual en DevTools
  // - drop console/debugger → sin logs con datos internos en producción
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
  esbuild: command === 'build'
    ? { drop: ['console', 'debugger'] }
    : undefined,
}))
