"use client";

import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="auth-screen">
      <div className="auth-card text-center">
        <Image src="/logo.png" alt="VectorIA" width={140} height={36} className="mx-auto mb-4" priority />
        <h1 className="page-title">Sin conexión</h1>
        <p className="page-description mt-2">
          No hay red disponible. Las páginas que ya visitaste pueden seguir abriéndose; el resto requiere
          conexión.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <button type="button" className="btn btn-primary w-full" onClick={() => window.location.reload()}>
            Reintentar
          </button>
          <Link href="/dashboard" className="btn btn-secondary w-full">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
