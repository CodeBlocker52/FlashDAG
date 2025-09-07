import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'window',
    'Buffer': 'window.Buffer',
  },
  resolve: {
    alias: {
      buffer: 'buffer', // Remove this if it's still causing issues
    },
  },
  optimizeDeps: {
    include: [],
  },
});
