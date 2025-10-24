import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Firebase SDK を複数インスタンスに束ねないよう明示的に同一化する
    dedupe: ['firebase', '@firebase/app', '@firebase/firestore'],
  },
})
