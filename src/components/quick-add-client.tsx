"use client";

import { useState } from "react";

type CreatedClient = { id: string; folio: string; name: string };

type QuickAddClientProps = {
  onCreated: (client: CreatedClient) => void | Promise<void>;
};

/** Carga rápida de cliente con campos mínimos (Discovery §4). */
export function QuickAddClient({ onCreated }: QuickAddClientProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el cliente");
        return;
      }
      await onCreated(data.client);
      setForm({ name: "", phone: "", email: "" });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(true)}>
        + Carga rápida de cliente
      </button>
    );
  }

  return (
    <form
      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-2"
      onSubmit={(e) => void submit(e)}
    >
      <p className="text-sm font-medium">Nuevo cliente (carga rápida)</p>
      <input
        placeholder="Nombre *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        disabled={busy}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      />
      <input
        placeholder="Celular *"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        required
        disabled={busy}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      />
      <input
        type="email"
        placeholder="Correo *"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        disabled={busy}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary text-sm" disabled={busy}>
          Guardar cliente
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
