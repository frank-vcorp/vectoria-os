"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ClientFiscalData } from "@/shared/commercial";
import {
  ClientFiscalFields,
  emptyFiscal,
  hasFiscalData,
} from "@/components/client-fiscal-fields";

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
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFiscal, setShowFiscal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    fiscalData: { ...emptyFiscal },
  });

  async function load(q?: string) {
    const url = q ? `/api/clients?q=${encodeURIComponent(q)}` : "/api/clients";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
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
      <form className="card space-y-3" onSubmit={(e) => void createClient(e)}>
        <h2 className="font-medium">Nuevo cliente</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            placeholder="Nombre (persona o empresa) *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <input
            placeholder="Contacto (opcional, si es empresa)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <input
            placeholder="Celular *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <input
            type="email"
            placeholder="Correo *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
        <details open={showFiscal} onToggle={(e) => setShowFiscal(e.currentTarget.open)}>
          <summary className="cursor-pointer text-sm font-medium">Datos fiscales (opcional)</summary>
          <ClientFiscalFields
            data={form.fiscalData}
            onChange={(fiscalData) => setForm({ ...form, fiscalData })}
          />
        </details>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Guardar cliente
        </button>
      </form>

      <div className="flex gap-2">
        <input
          placeholder="Buscar por folio o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
        <button type="button" className="btn btn-ghost" onClick={() => void load(search)}>
          Buscar
        </button>
      </div>

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
