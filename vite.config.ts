import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Include process and other Node.js globals
      include: ['process', 'util', 'assert', 'buffer', 'stream', 'events'],
      // Exclude crypto to avoid conflicts with Vite's internal usage
      exclude: ['crypto']
    }),
  ],
  define: {
    // Provide process global for Node.js modules
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api/fusion': {
        target: 'https://fusion.1inch.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fusion/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add proper headers for Fusion+ API
            proxyReq.setHeader('Origin', 'https://fusion.1inch.io');
            proxyReq.setHeader('Referer', 'https://fusion.1inch.io/');
            proxyReq.setHeader('User-Agent', '1inch-fusion-sdk');
            proxyReq.setHeader('Accept', 'application/json');
          });
        }
      }
    }
  }
})
