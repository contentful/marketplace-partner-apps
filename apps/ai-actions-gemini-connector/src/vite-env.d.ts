/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV: boolean
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
