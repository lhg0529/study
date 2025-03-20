import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9999,
    open: true,
  },
  resolve: {
    alias: [{ find: 'components', replacement: '/src/components' }],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Carbon 설정을 위한 SASS 옵션
        quietDeps: true,
      },
    },
  },
})
