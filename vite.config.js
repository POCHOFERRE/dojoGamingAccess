import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      // Remove the @firebase alias to prevent conflicts with node_modules
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3004,
    strictPort: true,
    hmr: {
      clientPort: 3004
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      // Ensure Firebase modules are properly bundled
      external: [],
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics']
        }
      }
    },
    commonjsOptions: {
      // Handle ESM modules in dependencies
      include: [/node_modules/],
      transformMixedEsModules: true,
      esmExternals: true
    }
  },
  publicDir: 'public',
  root: './',
  base: '/',
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/analytics'
    ],
    esbuildOptions: {
      // Enable esbuild's module type for .js files in node_modules
      loader: {
        '.js': 'jsx',
      },
    },
  },
  define: {
    // Fix for Firebase 9+ with Vite
    'process.env': {}
  }
});
