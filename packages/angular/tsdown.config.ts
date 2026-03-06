// TODO: replace ng-packagr with tsdown once @oxc-angular/vite supports emitting
// Angular ivy declarations (ɵcmp) in .d.ts output for library builds.
// Tracked at: https://github.com/voidzero-dev/oxc-angular-compiler/issues/86
/* import { defineConfig } from 'tsdown'
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
 */
