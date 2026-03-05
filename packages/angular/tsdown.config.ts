import { defineConfig } from 'tsdown'
import { angular } from '@oxc-angular/vite'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2024'],
  format: 'esm',
  clean: true,
  dts: true,
  platform: 'browser',
  outDir: './dist',
  plugins: [...angular({ tsconfig: './tsconfig.json' })],
})
