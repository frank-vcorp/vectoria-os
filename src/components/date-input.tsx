"use client";

export function DateInput({
  value,
  onChange,
  required,
  disabled,
  className = "",
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      className={`bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm ${className}`}
    />
  );
}
