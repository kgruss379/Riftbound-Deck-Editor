import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Read Riot API Key from APIkey.txt dynamically
let apiKey = ''
try {
  const filePath = path.resolve(__dirname, 'APIkey.txt')
  if (fs.existsSync(filePath)) {
    apiKey = fs.readFileSync(filePath, 'utf-8').trim()
  }
} catch (error) {
  console.warn('Unable to read APIkey.txt:', error.message)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'docs',
  },
  define: {
    'process.env.VITE_RIOT_API_KEY': JSON.stringify(apiKey),
  },
  server: {
    proxy: {
      '/riot-api': {
        target: 'https://na1.api.riotgames.com', // default fallback
        changeOrigin: true,
        router: (req) => {
          // Extract the target region from our custom headers
          const region = req.headers['x-riot-region'] || 'na1';
          return `https://${region}.api.riotgames.com`;
        },
        rewrite: (path) => path.replace(/^\/riot-api/, ''),
      }
    }
  }
})
