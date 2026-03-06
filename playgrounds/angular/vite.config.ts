import { defineConfig } from 'vite'
import { angular } from '@oxc-angular/vite'

export default defineConfig({
  plugins: [...angular({ tsconfig: './tsconfig.app.json' })],
})
