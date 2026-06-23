import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // ይህ በጣም ወሳኝ ነው! ያለ እሱ Electron ፋይሎቹን አያገኛቸውም።
})