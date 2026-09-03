"use client";

import type { ClientFiscalData } from "@/shared/commercial";
import { SearchableSelect } from "@/components/searchable-select";
import { SAT_REGIMEN_FISCAL, SAT_USO_CFDI } from "@/shared/sat-catalogs";

export function ClientFiscalFields({
  data,
  onChange,
}: {
  data: ClientFiscalData;
  onChange: (d: ClientFiscalData) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2 mt-2">
      <label className="text-sm">
        <span className="text-[var(--muted)]">RFC</span>
        <input
          value={data.rfc ?? ""}
          onChange={(e) => onChange({ ...data, rfc: e.target.value })}
          className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
      </label>
      <label className="text-sm">
        <span className="text-[var(--muted)]">Razón social</span>
        <input
          value={data.razonSocial ?? ""}
          onChange={(e) => onChange({ ...data, razonSocial: e.target.value })}
          className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
      </label>
      <label className="text-sm">
        <span className="text-[var(--muted)]">Régimen fiscal (SAT)</span>
        <SearchableSelect
          className="mt-1 w-full"
          value={data.regimenFiscal ?? ""}
          onChange={(regimenFiscal) => onChange({ ...data, regimenFiscal })}
          placeholder="Seleccionar…"
          options={SAT_REGIMEN_FISCAL.map((o) => ({
            value: o.code,
            label: o.label,
            keywords: o.code,
          }))}
        />
      </label>
      <label className="text-sm">
        <span className="text-[var(--muted)]">Código postal</span>
        <input
          value={data.codigoPostal ?? ""}
          onChange={(e) => onChange({ ...data, codigoPostal: e.target.value })}
          className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
        />
      </label>
      <label className="text-sm md:col-span-2">
        <span className="text-[var(--muted)]">Uso CFDI (SAT)</span>
        <SearchableSelect
          className="mt-1 w-full"
          value={data.usoCfdi ?? ""}
          onChange={(usoCfdi) => onChange({ ...data, usoCfdi })}
          placeholder="Seleccionar…"
          options={SAT_USO_CFDI.map((o) => ({
            value: o.code,
            label: o.label,
            keywords: o.code,
          }))}
        />
      </label>
    </div>
  );
}

export function hasFiscalData(data: ClientFiscalData) {
  return Object.values(data).some((v) => v && v.trim());
}

export const emptyFiscal: ClientFiscalData = {
  rfc: "",
  razonSocial: "",
  regimenFiscal: "",
  codigoPostal: "",
  usoCfdi: "",
};
