"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vectoria-pwa-install-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function attachUpdateListener(registration: ServiceWorkerRegistration, onWaiting: () => void) {
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        onWaiting();
      }
    });
  });

  if (registration.waiting && navigator.serviceWorker.controller) {
    onWaiting();
  }
}

/** Registra el SW en todas las rutas (requerido para instalación). */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    if (isIosSafari()) {
      setIosHint(true);
      setHidden(false);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
    setDeferred(null);
    setIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="pwa-banner" role="region" aria-label="Instalar aplicación">
      <div className="pwa-banner-text">
        <p className="pwa-banner-title">Instalar VectorIA OS</p>
        <p className="pwa-banner-desc">
          {iosHint
            ? "En Safari: Compartir → Agregar a pantalla de inicio."
            : "Acceso rápido desde escritorio o inicio, como app nativa."}
        </p>
      </div>
      <div className="pwa-banner-actions">
        {!iosHint && deferred && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void install()}>
            Instalar
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
          Ahora no
        </button>
      </div>
    </div>
  );
}

export function PwaUpdateNotifier() {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      attachUpdateListener(registration, () => setWaiting(true));
    });
  }, []);

  function applyUpdate() {
    void navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
  }

  if (!waiting) return null;

  return (
    <div className="pwa-banner pwa-banner-update" role="status">
      <div className="pwa-banner-text">
        <p className="pwa-banner-title">Nueva versión disponible</p>
        <p className="pwa-banner-desc">Actualiza para obtener los últimos cambios.</p>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={applyUpdate}>
        Actualizar
      </button>
    </div>
  );
}
