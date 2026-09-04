"use client";

import { useEffect, useRef, useState } from "react";

type MoneyInputProps = {
  label?: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  required?: boolean;
  className?: string;
};

function centsToDisplay(cents: number): string {
  if (cents <= 0) return "";
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return `${whole.toLocaleString("es-MX")}.${frac}`;
}

/** Parsea texto a centavos sin usar floats (evita 4.014545…). */
function parseToCents(raw: string): number {
  const normalized = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!normalized) return 0;

  const dot = normalized.indexOf(".");
  if (dot === -1) {
    const whole = parseInt(normalized, 10);
    return isNaN(whole) ? 0 : whole * 100;
  }

  const wholePart = normalized.slice(0, dot).replace(/\D/g, "") || "0";
  const fracPart = normalized.slice(dot + 1).replace(/\D/g, "").slice(0, 2);
  const whole = parseInt(wholePart, 10);
  const frac = parseInt(fracPart.padEnd(2, "0"), 10);
  if (isNaN(whole) || isNaN(frac)) return 0;
  return whole * 100 + frac;
}

/** Entrada monetaria MXN con prefijo $ (almacena centavos). */
export function MoneyInput({ label, valueCents, onChangeCents, required, className = "" }: MoneyInputProps) {
  const [text, setText] = useState(() => centsToDisplay(valueCents));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText(centsToDisplay(valueCents));
    }
  }, [valueCents]);

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^\d.,]/g, "");
    setText(cleaned);
    onChangeCents(parseToCents(cleaned));
  }

  function handleBlur() {
    focused.current = false;
    setText(centsToDisplay(valueCents));
  }

  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="text-[var(--muted)]">{label}</span>}
      <div className={`relative ${label ? "mt-1" : ""}`}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none select-none w-4 text-center">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={text}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 tabular-nums"
        />
      </div>
    </label>
  );
}