"use client";

export function ListSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar por folio o cliente…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2 max-w-md">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={placeholder}
        className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      />
      <button type="button" className="btn btn-ghost text-sm" onClick={onSearch}>
        Buscar
      </button>
    </div>
  );
}
