/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MASTER_REGISTRY_URL?: string;
  readonly VITE_APPS_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
