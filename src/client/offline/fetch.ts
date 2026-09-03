import { cacheGet, cacheSet, newOutboxId, outboxAdd } from "@/client/offline/db";
import type { OfflineModule } from "@/client/offline/types";
import { cacheKey } from "@/client/offline/types";

export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export class OfflineNoCacheError extends Error {
  constructor(message = "OFFLINE_NO_CACHE") {
    super(message);
    this.name = "OfflineNoCacheError";
  }
}

/** GET con caché: red primero; si falla, devuelve caché del módulo. */
export async function cachedGet<T>(module: OfflineModule, key: string, url: string) {
  const storageKey = cacheKey(module, key);

  if (isOnline()) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const data = (await res.json()) as T;
      await cacheSet(storageKey, data);
      return { data, fromCache: false as const };
    } catch {
      const cached = await cacheGet<T>(storageKey);
      if (cached) return { data: cached, fromCache: true as const };
      throw new OfflineNoCacheError();
    }
  }

  const cached = await cacheGet<T>(storageKey);
  if (cached) return { data: cached, fromCache: true as const };
  throw new OfflineNoCacheError();
}

type QueuedPatchOptions = {
  url?: string;
  method?: "PATCH" | "POST";
};

type PatchResult<T> =
  | { ok: true; queued: false; data: T }
  | { ok: true; queued: true }
  | { ok: false; error: string; status?: number };

/** PATCH/POST: en línea ejecuta; sin red encola para sync. */
export async function queuedWrite<T = unknown>(
  module: OfflineModule,
  body: Record<string, unknown>,
  options: QueuedPatchOptions = {},
): Promise<PatchResult<T>> {
  const url = options.url ?? "/api/projects";
  const method = options.method ?? "PATCH";

  if (isOnline()) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "ERROR", status: res.status };
    }
    return { ok: true, queued: false, data };
  }

  await outboxAdd({
    id: newOutboxId(),
    module,
    url,
    method,
    body,
    createdAt: Date.now(),
    retries: 0,
  });

  return { ok: true, queued: true };
}

/** Invalida y refresca caché de detalle de proyecto tras sync. */
export async function refreshProjectCache(projectId: string, data: unknown) {
  await cacheSet(cacheKey("proyectos", `detail:${projectId}`), data);
}

export async function mergeProjectListCache(projectId: string, patch: Record<string, unknown>) {
  const list = await cacheGet<{ projects: Record<string, unknown>[] }>(cacheKey("proyectos", "list:"));
  if (!list?.projects) return;
  list.projects = list.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p));
  await cacheSet(cacheKey("proyectos", "list:"), list);
}
