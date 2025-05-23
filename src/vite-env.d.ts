/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RUN_ENV?: string;
  // other env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
