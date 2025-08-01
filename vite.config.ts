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
    'process.env': {},
  },
})
