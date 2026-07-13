/// <reference types="vite/client" />

declare module 'virtual:master-cmdk/semantic-vectors' {
  export const model: string
  export const modelAssets: { config: string; model: string; vocab: string }
  export const vectors: Record<string, readonly number[]>
  const semanticVectors: {
    model: string
    modelAssets: { config: string; model: string; vocab: string }
    vectors: Record<string, readonly number[]>
  }
  export default semanticVectors
}
