import { defineConfig } from 'tsdown'
import Solid from 'unplugin-solid/rolldown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2020'],
  clean: true,
  dts: true,
  platform: 'neutral',
  outDir: './dist',
  plugins: [Solid()],
})
