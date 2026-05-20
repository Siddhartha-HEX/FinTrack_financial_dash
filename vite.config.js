import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Raise the warning threshold so CI stays clean
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes rarely, cache-friendly
          'vendor-react': ['react', 'react-dom'],
          // Firebase split by SDK surface
          'vendor-firebase-app': ['firebase/app'],
          'vendor-firebase-auth': ['firebase/auth'],
          'vendor-firebase-firestore': ['firebase/firestore'],
          // UI / charting libraries
          'vendor-recharts': ['recharts'],
          'vendor-framer': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'react-toastify'],
        },
      },
    },
  },
});
