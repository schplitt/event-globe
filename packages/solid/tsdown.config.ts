import { defineConfig } from 'tsdown'
import Solid from 'unplugin-solid/rolldown'

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
  plugins: [Solid()],
})
