"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PwaInstallPrompt } from "@/components/pwa-manager";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Credenciales inválidas");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-screen">
      <PwaInstallPrompt />
      <div className="auth-card">
        <div className="auth-brand">
          <Image src="/logo.png" alt="VectorIA" width={168} height={44} priority />
          <p>Sistema operativo interno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
