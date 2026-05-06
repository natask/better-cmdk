import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts'],
  sourcemap: false,
  minify: true,
  dts: true,
  format: ['esm', 'cjs'],
})
