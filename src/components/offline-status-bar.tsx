"use client";

import { useOffline } from "@/components/offline-provider";

export function OfflineStatusBar() {
  const { online, pendingCount, syncing, lastSyncError, fromCache, syncNow } = useOffline();

  if (online && pendingCount === 0 && !fromCache && !lastSyncError) return null;

  return (
    <div
      className={`offline-status${online ? "" : " offline-status-disconnected"}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-status-text">
        {!online && <span>Sin conexión</span>}
        {online && fromCache && pendingCount === 0 && (
          <span>Mostrando datos guardados — reconecta para actualizar</span>
        )}
        {pendingCount > 0 && (
          <span>
            {pendingCount} cambio{pendingCount === 1 ? "" : "s"} pendiente{pendingCount === 1 ? "" : "s"}
            {!online ? " (se enviarán al reconectar)" : ""}
          </span>
        )}
        {lastSyncError && online && (
          <span className="text-[var(--danger)]">Sync: {lastSyncError}</span>
        )}
      </div>
      {online && pendingCount > 0 && (
        <button type="button" className="btn btn-ghost btn-sm" disabled={syncing} onClick={() => void syncNow()}>
          {syncing ? "Sincronizando…" : "Sincronizar"}
        </button>
      )}
    </div>
  );
}
