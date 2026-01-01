import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2020'],
  format: 'esm',
  clean: true,
  dts: true,
  outDir: './dist',
})
