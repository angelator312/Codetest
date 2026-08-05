import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  server:{
    proxy: {
        '/run': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
      },
        '/files': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
      },
    }
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
