import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2024'],
  clean: true,
  dts: { vue: true },
  platform: 'browser',
  outDir: './dist',
  plugins: [Vue({ isProduction: true })],
})
