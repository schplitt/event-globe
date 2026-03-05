import { defineConfig } from 'tsdown'
import { angular } from '@oxc-angular/vite'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2020'],
  clean: true,
  dts: true,
  outDir: './dist',
  plugins: [...angular({ tsconfig: './tsconfig.json' })],
})
