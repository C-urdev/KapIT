import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-dom') || id.includes('\\react\\') || id.includes('/react/')) {
            return 'react-vendor';
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          if (id.includes('phil-reg-prov-mun-brgy')) {
            return 'location-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@sharedComponents': path.resolve(__dirname, './src/shared/components'),
      '@sharedPages': path.resolve(__dirname, './src/shared/pages'),
      '@sharedContext': path.resolve(__dirname, './src/shared/context'),
      '@sharedServices': path.resolve(__dirname, './src/shared/services'),
      '@sharedUtils': path.resolve(__dirname, './src/shared/utils'),
      '@user': path.resolve(__dirname, './src/user'),
      '@userComponents': path.resolve(__dirname, './src/user/components'),
      '@userPages': path.resolve(__dirname, './src/user/pages'),
      '@userFeatures': path.resolve(__dirname, './src/user/features'),
      '@userLayouts': path.resolve(__dirname, './src/user/layouts'),
      '@company': path.resolve(__dirname, './src/company'),
      '@companyComponents': path.resolve(__dirname, './src/company/components'),
      '@companyPages': path.resolve(__dirname, './src/company/pages'),
      '@companyFeatures': path.resolve(__dirname, './src/company/features'),
      '@companyLayouts': path.resolve(__dirname, './src/company/layouts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
})

