export type OutboxItem = {
  id: string;
  module: OfflineModule;
  url: string;
  method: "PATCH" | "POST";
  body: Record<string, unknown>;
  createdAt: number;
  retries: number;
  lastError?: string;
};

export type OfflineModule = "proyectos" | "clientes" | "ordenes_servicio";

export type CachedPayload = {
  data: unknown;
  savedAt: number;
};

export const OFFLINE_MODULES: OfflineModule[] = ["proyectos", "clientes", "ordenes_servicio"];

export function cacheKey(module: OfflineModule, key: string) {
  return `${module}:${key}`;
}
