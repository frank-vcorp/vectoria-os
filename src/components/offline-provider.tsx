"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { outboxList } from "@/client/offline/db";
import { syncOutbox } from "@/client/offline/sync";

type OfflineContextValue = {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncError: string | null;
  fromCache: boolean;
  setFromCache: (value: boolean) => void;
  refreshPending: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const refreshPending = useCallback(async () => {
    const items = await outboxList();
    setPendingCount(items.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    setLastSyncError(null);
    try {
      const result = await syncOutbox();
      await refreshPending();
      if (result.failed > 0 && result.processed === 0) {
        setLastSyncError(result.errors[0]?.error ?? "Error al sincronizar");
      }
      if (result.processed > 0) {
        window.dispatchEvent(new CustomEvent("vectoria:offline-synced"));
      }
    } finally {
      setSyncing(false);
    }
  }, [refreshPending, syncing]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refreshPending();

    function onOnline() {
      setOnline(true);
      void syncNow();
    }
    function onOffline() {
      setOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refreshPending, syncNow]);

  useEffect(() => {
    const id = window.setInterval(() => void refreshPending(), 8000);
    return () => window.clearInterval(id);
  }, [refreshPending]);

  const value = useMemo(
    () => ({
      online,
      pendingCount,
      syncing,
      lastSyncError,
      fromCache,
      setFromCache,
      refreshPending,
      syncNow,
    }),
    [online, pendingCount, syncing, lastSyncError, fromCache, refreshPending, syncNow],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
