import {
  cacheGet,
  cacheSet,
  outboxList,
  outboxRemove,
  outboxUpdate,
} from "@/client/offline/db";
import { cacheKey } from "@/client/offline/types";
import type { OutboxItem } from "@/client/offline/types";

export type SyncResult = {
  processed: number;
  failed: number;
  errors: { id: string; error: string }[];
};

export async function syncOutbox(): Promise<SyncResult> {
  const items = await outboxList();
  const result: SyncResult = { processed: 0, failed: 0, errors: [] };

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = typeof data.error === "string" ? data.error : `HTTP_${res.status}`;
        if (res.status === 409 || res.status === 403 || res.status === 404) {
          await outboxRemove(item.id);
          result.failed += 1;
          result.errors.push({ id: item.id, error: err });
          continue;
        }
        throw new Error(err);
      }

      await applySyncSideEffects(item, data);
      await outboxRemove(item.id);
      result.processed += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : "SYNC_ERROR";
      const next: OutboxItem = {
        ...item,
        retries: item.retries + 1,
        lastError: message,
      };
      await outboxUpdate(next);
      result.failed += 1;
      result.errors.push({ id: item.id, error: message });
      if (item.retries >= 5) {
        /* keep in queue but stop blocking subsequent items from different projects? continue */
      }
    }
  }

  return result;
}

async function applySyncSideEffects(item: OutboxItem, data: unknown) {
  if (item.module !== "proyectos") return;

  const body = item.body;
  const projectId =
    (typeof body.projectId === "string" && body.projectId) ||
    (typeof body.id === "string" && body.id) ||
    null;

  if (projectId && data && typeof data === "object" && "project" in data && "phases" in data) {
    await cacheSet(cacheKey("proyectos", `detail:${projectId}`), data);
  } else if (projectId && data && typeof data === "object" && "phases" in data) {
    const existing = await cacheGet<{ project: unknown; phases: unknown }>(
      cacheKey("proyectos", `detail:${projectId}`),
    );
    if (existing) {
      await cacheSet(cacheKey("proyectos", `detail:${projectId}`), {
        ...existing,
        phases: (data as { phases: unknown }).phases,
      });
    }
  }
}
