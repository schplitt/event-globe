import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2020'],
  clean: true,
  dts: { vue: true },
  platform: 'neutral',
  outDir: './dist',
  plugins: [Vue({ isProduction: true })],
})
