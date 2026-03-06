import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import { defineConfig } from 'tsdown'

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
  plugins: [
    svelte(
      {
        preprocess: sveltePreprocess(),
        compilerOptions: {
          customElement: true,
        },
      },
    ),
  ],
})
