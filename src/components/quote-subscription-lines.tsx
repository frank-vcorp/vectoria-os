"use client";

import { MoneyInput } from "@/components/money-input";
import { SearchableSelect } from "@/components/searchable-select";
import { formatMoney, type QuoteSubscriptionItemInput } from "@/shared/commercial";

export type SubscriptionTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  status: string;
};

export type PeriodicityOption = { id: string; name: string; status?: string };

export type QuoteSubscriptionLineForm = QuoteSubscriptionItemInput & { key: string };

type Props = {
  lines: QuoteSubscriptionLineForm[];
  onChange: (lines: QuoteSubscriptionLineForm[]) => void;
  templates: SubscriptionTemplateOption[];
  periodicities: PeriodicityOption[];
  disabled?: boolean;
};

function newLineKey() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptySubscriptionLine(): QuoteSubscriptionLineForm {
  return {
    key: newLineKey(),
    subscriptionTemplateId: "",
    description: "",
    price: 0,
    periodicityId: "",
  };
}

export function QuoteSubscriptionLinesEditor({
  lines,
  onChange,
  templates,
  periodicities,
  disabled = false,
}: Props) {
  const activeTemplates = templates.filter((t) => t.status === "activo");

  function updateLine(key: string, patch: Partial<QuoteSubscriptionLineForm>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key));
  }

  function addLine() {
    onChange([...lines, createEmptySubscriptionLine()]);
  }

  function onTemplateSelect(key: string, templateId: string) {
    const template = activeTemplates.find((t) => t.id === templateId);
    if (!template) {
      updateLine(key, { subscriptionTemplateId: templateId });
      return;
    }
    updateLine(key, {
      subscriptionTemplateId: templateId,
      description: template.description?.trim() || template.name,
      price: template.basePrice,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Suscripciones propuestas</h3>
        {!disabled && (
          <button type="button" className="btn btn-ghost text-sm" onClick={addLine}>
            + Agregar suscripción
          </button>
        )}
      </div>

      {lines.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Sin partidas de suscripción (opcional).</p>
      )}

      {lines.map((line, index) => (
        <div key={line.key} className="rounded-lg border border-[var(--border)] p-3 space-y-2 bg-[var(--surface-2)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--muted)]">Partida {index + 1}</span>
            {!disabled && (
              <button type="button" className="btn btn-ghost text-xs" onClick={() => removeLine(line.key)}>
                Quitar
              </button>
            )}
          </div>
          <SearchableSelect
            className="w-full"
            value={line.subscriptionTemplateId}
            onChange={(templateId) => onTemplateSelect(line.key, templateId)}
            required
            disabled={disabled}
            placeholder="Suscripción del catálogo…"
            options={activeTemplates.map((t) => ({ value: t.id, label: t.name }))}
          />
          <textarea
            value={line.description}
            onChange={(e) => updateLine(line.key, { description: e.target.value })}
            placeholder="Descripción *"
            required
            disabled={disabled}
            rows={2}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid gap-2 md:grid-cols-2">
            <MoneyInput
              label="Precio (MXN)"
              valueCents={line.price}
              onChangeCents={(price) => updateLine(line.key, { price })}
              required
              className={disabled ? "opacity-60 pointer-events-none" : ""}
            />
            <label className="text-sm block">
              <span className="text-[var(--muted)]">Periodicidad</span>
              <SearchableSelect
                className="mt-1 w-full"
                value={line.periodicityId}
                onChange={(periodicityId) => updateLine(line.key, { periodicityId })}
                required
                disabled={disabled}
                placeholder="Periodicidad…"
                options={periodicities
                  .filter((p) => !p.status || p.status === "activo")
                  .map((p) => ({ value: p.id, label: p.name }))}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuoteSubscriptionLinesReadonly({
  items,
}: {
  items: {
    subscriptionTemplateName: string;
    description: string;
    price: number;
    periodicityName: string;
  }[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="font-medium">Suscripciones propuestas</h3>
      <ul className="text-sm space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface-2)]">
            <p className="font-medium">{item.subscriptionTemplateName}</p>
            <p className="text-[var(--muted)] mt-1">{item.description}</p>
            <p className="mt-2">
              {formatMoney(item.price)} · {item.periodicityName}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function toSubscriptionItemPayload(lines: QuoteSubscriptionLineForm[]): QuoteSubscriptionItemInput[] {
  return lines.map(({ subscriptionTemplateId, description, price, periodicityId }) => ({
    subscriptionTemplateId,
    description,
    price,
    periodicityId,
  }));
}
