"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField, FormPanel } from "@/components/form-panel";
import { ListSearchInput } from "@/components/list-search-input";
import { SearchableSelect } from "@/components/searchable-select";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/shared/commercial";
import {
  SURVEY_OPERATION_LABELS,
  SURVEY_OPERATION_TYPES,
  SURVEY_STATUS_LABELS,
  type SurveyOperationType,
  type SurveyStatus,
} from "@/shared/surveys";

type SurveyRow = {
  id: string;
  folio: string;
  quoteId: string;
  quoteFolio: string;
  clientId: string;
  clientName: string;
  operationType: SurveyOperationType;
  responsibleName: string;
  status: SurveyStatus;
  updatedAt: string;
};

type QuoteOption = { id: string; folio: string; clientName: string; status: QuoteStatus };

export function SurveysManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetQuoteId = searchParams.get("quoteId") ?? "";
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [form, setForm] = useState({ operationType: "" as string, quoteId: presetQuoteId });
  const [existingForQuote, setExistingForQuote] = useState<SurveyRow[]>([]);

  const selectedQuote = useMemo(() => quotes.find((quote) => quote.id === form.quoteId), [quotes, form.quoteId]);

  async function loadMeta() {
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const data = await me.json();
      setCanWrite(Boolean(data.permissions?.levantamientos?.canWrite));
    }
    const quotesRes = await fetch("/api/quotes");
    if (quotesRes.ok) {
      const data = await quotesRes.json();
      setQuotes(data.quotes ?? []);
    }
  }

  async function loadSurveys(nextSearch = search) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/surveys?${params.toString()}`);
    if (res.ok) setRows((await res.json()).surveys);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([loadMeta(), loadSurveys()]);
  }, []);

  useEffect(() => {
    if (!form.quoteId) {
      setExistingForQuote([]);
      return;
    }
    void fetch(`/api/surveys?quoteId=${form.quoteId}`)
      .then((res) => (res.ok ? res.json() : { surveys: [] }))
      .then((data) => setExistingForQuote(data.surveys ?? []));
  }, [form.quoteId]);

  async function createSurvey(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Error");
      return;
    }
    const data = await res.json();
    router.push(`/levantamientos/${data.survey.id}`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="card space-y-3 overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          <ListSearchInput
            value={search}
            onChange={setSearch}
            onSearch={() => {
              setLoading(true);
              void loadSurveys(search);
            }}
            placeholder="Buscar por folio, cliente o cotización…"
          />
          <select
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {SURVEY_OPERATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SURVEY_OPERATION_LABELS[type]}
              </option>
            ))}
          </select>
          <select
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(SURVEY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => {
              setLoading(true);
              void loadSurveys(search);
            }}
          >
            Filtrar
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-2">Folio</th>
              <th className="py-2 pr-2">Cliente</th>
              <th className="py-2 pr-2">Cotización</th>
              <th className="py-2 pr-2">Tipo</th>
              <th className="py-2 pr-2">Responsable</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2 pr-2 font-mono text-xs">
                  <Link href={`/levantamientos/${row.id}`} className="underline">
                    {row.folio}
                  </Link>
                </td>
                <td className="py-2 pr-2">
                  <Link href={`/clientes/${row.clientId}`} className="underline">
                    {row.clientName}
                  </Link>
                </td>
                <td className="py-2 pr-2 font-mono text-xs">
                  <Link href={`/cotizaciones/${row.quoteId}`} className="underline">
                    {row.quoteFolio}
                  </Link>
                </td>
                <td className="py-2 pr-2">{SURVEY_OPERATION_LABELS[row.operationType]}</td>
                <td className="py-2 pr-2">{row.responsibleName}</td>
                <td className="py-2 pr-2">
                  <span className="badge">{SURVEY_STATUS_LABELS[row.status]}</span>
                </td>
                <td className="py-2 text-xs text-[var(--muted)]">{new Date(row.updatedAt).toLocaleString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-[var(--muted)]">Sin levantamientos.</p>}
      </div>

      {canWrite && (
        <form onSubmit={(e) => void createSurvey(e)}>
          <FormPanel
            title="Nuevo levantamiento"
            description="Seleccione un tipo de operación y una cotización existente. No se crea cliente ni cotización desde aquí."
            actions={
              <button type="submit" className="btn btn-primary" disabled={!form.operationType || !form.quoteId}>
                Crear levantamiento
              </button>
            }
          >
            <FormField label="Tipo de operación *">
              <SearchableSelect
                className="w-full"
                value={form.operationType}
                onChange={(operationType) => setForm((current) => ({ ...current, operationType }))}
                required
                placeholder="Seleccionar un solo tipo…"
                options={SURVEY_OPERATION_TYPES.map((type) => ({
                  value: type,
                  label: SURVEY_OPERATION_LABELS[type],
                }))}
              />
            </FormField>
            <FormField label="Cotización *">
              <SearchableSelect
                className="w-full"
                value={form.quoteId}
                onChange={(quoteId) => setForm((current) => ({ ...current, quoteId }))}
                required
                placeholder="Buscar por folio o cliente…"
                options={quotes.map((quote) => ({
                  value: quote.id,
                  label: `${quote.folio} — ${quote.clientName} (${QUOTE_STATUS_LABELS[quote.status]})`,
                  keywords: `${quote.folio} ${quote.clientName}`,
                }))}
              />
            </FormField>
            {selectedQuote && (selectedQuote.status === "rechazada" || selectedQuote.status === "cancelada") && (
              <p className="text-sm text-[var(--warning)]">
                La cotización está {QUOTE_STATUS_LABELS[selectedQuote.status]}. Puede entrevistarse, pero no se reactiva.
              </p>
            )}
            {existingForQuote.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="text-[var(--muted)]">Esta cotización ya tiene levantamientos. Puede continuar uno o crear otro independiente:</p>
                {existingForQuote.map((row) => (
                  <div key={row.id}>
                    <Link href={`/levantamientos/${row.id}`} className="underline font-mono text-xs">
                      {row.folio}
                    </Link>{" "}
                    · {SURVEY_OPERATION_LABELS[row.operationType]} · {SURVEY_STATUS_LABELS[row.status]}
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          </FormPanel>
        </form>
      )}
    </div>
  );
}
