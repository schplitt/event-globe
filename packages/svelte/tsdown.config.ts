import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: ['es2020'],
  clean: true,
  dts: true,
  platform: 'neutral',
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
