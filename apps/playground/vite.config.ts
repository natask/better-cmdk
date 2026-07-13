import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { potionCommandVectorPlugin } from 'master-cmdk/semantic/vite'

type SemanticCommand = {
  value: string
  label: string
  description: string
  aliases?: string[]
}

export default defineConfig({
  plugins: [
    potionCommandVectorPlugin<SemanticCommand>({
      items: 'src/semantic-commands.ts',
      model: 'potion-base-8M',
      getValue: item => item.value,
      getText: item => [item.label, item.description, ...(item.aliases ?? [])].join('\n'),
    }),
    react(),
  ],
  server: { port: 5173 },
})
