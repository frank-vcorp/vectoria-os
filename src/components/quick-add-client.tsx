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
  const [addContact, setAddContact] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "" });

  async function submit() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: addContact && form.contact.trim() ? form.contact.trim() : null,
          phone: form.phone.trim(),
          email: form.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo crear el cliente");
        return;
      }
      await onCreated(data.client);
      setForm({ name: "", contact: "", phone: "", email: "" });
      setAddContact(false);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function handleEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      void submit();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost text-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        + Carga rápida de cliente
      </button>
    );
  }

  return (
    <div
      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-2"
      onKeyDown={handleEnter}
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
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={addContact}
          onChange={(e) => {
            const checked = e.target.checked;
            setAddContact(checked);
            if (!checked) setForm({ ...form, contact: "" });
          }}
          disabled={busy}
          className="rounded border-[var(--border)]"
        />
        Agregar contacto y su número
      </label>
      {addContact && (
        <div className="space-y-2 pl-1 border-l-2 border-[var(--border)] ml-1">
          <input
            placeholder="Contacto"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            disabled={busy}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Número del contacto *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            disabled={busy}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}
      {!addContact && (
        <input
          placeholder="Celular *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          disabled={busy}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        />
      )}
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
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={busy || !form.name.trim() || !form.phone.trim() || !form.email.trim()}
          onClick={() => void submit()}
        >
          Guardar cliente
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError("");
            setAddContact(false);
            setForm({ name: "", contact: "", phone: "", email: "" });
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
