import type { CachedPayload, OutboxItem } from "@/client/offline/types";

const DB_NAME = "vectoria-offline";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("INDEXEDDB_UNAVAILABLE"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache");
      }
      if (!db.objectStoreNames.contains("outbox")) {
        const store = db.createObjectStore("outbox", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB_OPEN_FAILED"));
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readonly");
    const req = tx.objectStore("cache").get(key);
    req.onsuccess = () => {
      const row = req.result as CachedPayload | undefined;
      resolve(row?.data ? (row.data as T) : null);
    };
    req.onerror = () => reject(req.error ?? new Error("CACHE_GET_FAILED"));
  });
}

export async function cacheSet(key: string, data: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const payload: CachedPayload = { data, savedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cache", "readwrite");
    const req = tx.objectStore("cache").put(payload, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("CACHE_SET_FAILED"));
  });
}

export async function outboxList(): Promise<OutboxItem[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readonly");
    const req = tx.objectStore("outbox").getAll();
    req.onsuccess = () => {
      const items = (req.result as OutboxItem[]).sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error ?? new Error("OUTBOX_LIST_FAILED"));
  });
}

export async function outboxAdd(item: OutboxItem): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const req = tx.objectStore("outbox").put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("OUTBOX_ADD_FAILED"));
  });
}

export async function outboxRemove(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const req = tx.objectStore("outbox").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("OUTBOX_REMOVE_FAILED"));
  });
}

export async function outboxUpdate(item: OutboxItem): Promise<void> {
  await outboxAdd(item);
}

export function newOutboxId() {
  return crypto.randomUUID();
}
