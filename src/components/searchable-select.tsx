"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  required,
  disabled,
  className = "",
  emptyMessage = "Sin resultados",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => {
      const haystack = normalize(`${o.label} ${o.keywords ?? ""}`);
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open && !disabled) searchRef.current?.focus();
  }, [open, disabled]);

  function pick(next: string) {
    if (disabled) return;
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          if (open) setQuery("");
        }}
        className={`w-full text-left bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={selected ? "" : "text-[var(--muted)]"}>
          {selected?.label ?? placeholder}
        </span>
        <span className="text-[var(--muted)] text-xs shrink-0">{open ? "▴" : "▾"}</span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          value={value}
          required
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none h-0 w-0"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  setQuery("");
                }
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  pick(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">{emptyMessage}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => pick(o.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] ${
                      o.value === value ? "bg-[var(--surface-2)] font-medium" : ""
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
