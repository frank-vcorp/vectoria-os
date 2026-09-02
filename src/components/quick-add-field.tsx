"use client";

import { useState } from "react";

type QuickAddFieldProps = {
  placeholder: string;
  onAdd: (name: string) => Promise<void>;
  buttonLabel?: string;
};

/** Carga rápida: agregar registro sin abandonar la pantalla. */
export function QuickAddField({ placeholder, onAdd, buttonLabel = "+" }: QuickAddFieldProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      await onAdd(value.trim());
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex gap-2" onSubmit={(e) => void submit(e)}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        disabled={busy}
        className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
      />
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {buttonLabel}
      </button>
    </form>
  );
}
