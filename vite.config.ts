import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 상대 경로로 뽑습니다. 'id.github.io/game/' 같은 하위 경로에 올려도 동작합니다.
  base: './',
  server: {
    port: 5174,
    host: true,
  },
})
