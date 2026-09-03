"use client";

import { useEffect, useState } from "react";

type MoneyInputProps = {
  label?: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  required?: boolean;
  className?: string;
};

/** Entrada monetaria con prefijo $ (almacena centavos). */
export function MoneyInput({ label, valueCents, onChangeCents, required, className = "" }: MoneyInputProps) {
  const [text, setText] = useState(() => formatDisplay(valueCents));

  useEffect(() => {
    setText(formatDisplay(valueCents));
  }, [valueCents]);

  function formatDisplay(cents: number) {
    if (cents === 0) return "";
    return (cents / 100).toFixed(2);
  }

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*).*$/, "$1");
    setText(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 0) {
      onChangeCents(Math.round(num * 100));
    } else if (cleaned === "") {
      onChangeCents(0);
    }
  }

  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="text-[var(--muted)]">{label}</span>}
      <div className={`relative ${label ? "mt-1" : ""}`}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-2"
        />
      </div>
    </label>
  );
}
