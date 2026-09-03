"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ClientFiscalData } from "@/shared/commercial";
import { cachedGet, OfflineNoCacheError } from "@/client/offline/fetch";
import { useOffline } from "@/components/offline-provider";
import {
  ClientFiscalFields,
  emptyFiscal,
  hasFiscalData,
} from "@/components/client-fiscal-fields";
import { FormField, FormPanel } from "@/components/form-panel";

type ClientRow = {
  id: string;
  folio: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  fiscalData: ClientFiscalData | null;
};

export function ClientsManager() {
  const { setFromCache } = useOffline();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cacheNote, setCacheNote] = useState("");
  const [showFiscal, setShowFiscal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    fiscalData: { ...emptyFiscal },
  });

  async function load(q?: string) {
    const query = q ?? search;
    const url = query.trim() ? `/api/clients?q=${encodeURIComponent(query.trim())}` : "/api/clients";
    const cacheId = query.trim() ? `list:${query.trim()}` : "list:";
    setCacheNote("");
    try {
      const { data, fromCache } = await cachedGet<{ clients: ClientRow[] }>(
        "clientes",
        cacheId,
        url,
      );
      setClients(data.clients ?? []);
      setFromCache(fromCache);
      if (fromCache) setCacheNote("Listado desde datos guardados.");
    } catch (e) {
      if (e instanceof OfflineNoCacheError) {
        setError("Sin conexión y sin datos guardados de clientes.");
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        contact: form.contact || null,
        phone: form.phone.trim(),
        email: form.email.trim(),
        fiscalData: hasFiscalData(form.fiscalData) ? form.fiscalData : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear");
      return;
    }
    setForm({ name: "", contact: "", phone: "", email: "", fiscalData: { ...emptyFiscal } });
    setShowFiscal(false);
    await load(search);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void createClient(e)}>
        <FormPanel
          title="Nuevo cliente"
          description="Registra persona o empresa con contacto y, si aplica, datos fiscales."
          actions={
            <button type="submit" className="btn btn-primary">
              Guardar cliente
            </button>
          }
        >
          <div className="form-grid cols-2">
            <FormField label="Nombre *" hint="Persona o empresa">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Contacto" hint="Opcional, si es empresa">
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </FormField>
            <FormField label="Celular *">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Correo *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </FormField>
          </div>
          <details open={showFiscal} onToggle={(e) => setShowFiscal(e.currentTarget.open)}>
            <summary className="form-section-label cursor-pointer">Datos fiscales (opcional)</summary>
            <div className="mt-3">
              <ClientFiscalFields
                data={form.fiscalData}
                onChange={(fiscalData) => setForm({ ...form, fiscalData })}
              />
            </div>
          </details>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </FormPanel>
      </form>

      <div className="flex gap-2">
        <input
          placeholder="Buscar por folio o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <button type="button" className="btn btn-ghost" onClick={() => void load(search)}>
          Buscar
        </button>
      </div>

      {cacheNote && <p className="text-xs text-[var(--muted)]">{cacheNote}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-3">Folio</th>
              <th className="py-2 pr-3">Nombre</th>
              <th className="py-2 pr-3">Contacto</th>
              <th className="py-2 pr-3">Celular</th>
              <th className="py-2 pr-3">Correo</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="py-2 pr-3 font-mono text-xs">
                  <Link href={`/clientes/${c.id}`} className="underline">
                    {c.folio}
                  </Link>
                </td>
                <td className="py-2 pr-3">{c.name}</td>
                <td className="py-2 pr-3">{c.contact ?? "—"}</td>
                <td className="py-2 pr-3">{c.phone ?? "—"}</td>
                <td className="py-2 pr-3">{c.email ?? "—"}</td>
                <td className="py-2">
                  <Link href={`/clientes/${c.id}`} className="btn btn-ghost text-sm">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-4 text-center">Sin clientes registrados</p>
        )}
      </div>
    </div>
  );
}
