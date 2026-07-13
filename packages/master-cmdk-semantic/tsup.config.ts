import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts', 'src/potion.ts', 'src/potion-cli.ts', 'src/qwen.ts', 'src/embedding.ts', 'src/huggingface.ts'],
  sourcemap: false,
  minify: true,
  dts: true,
  external: ['vite'],
  format: ['esm', 'cjs'],
})
