"use client";

import { FormField, FormSectionBlock } from "@/components/form-panel";
import { SearchableSelect } from "@/components/searchable-select";

type CatalogOption = { id: string; name: string; body?: string | null };

type QuoteCommercialFieldsProps = {
  deliveryTimeId: string;
  paymentConditionId: string;
  termsConditionId: string;
  observations: string;
  onChange: (patch: {
    deliveryTimeId?: string;
    paymentConditionId?: string;
    termsConditionId?: string;
    observations?: string;
  }) => void;
  deliveryTimes: CatalogOption[];
  paymentConditions: CatalogOption[];
  termsConditions: CatalogOption[];
};

export function QuoteCommercialFields({
  deliveryTimeId,
  paymentConditionId,
  termsConditionId,
  observations,
  onChange,
  deliveryTimes,
  paymentConditions,
  termsConditions,
}: QuoteCommercialFieldsProps) {
  const selectedTerms = termsConditions.find((t) => t.id === termsConditionId);

  return (
    <FormSectionBlock
      title="Condiciones comerciales"
      description="Tiempo de entrega, pago, términos y observaciones."
    >
      <div className="form-grid cols-2">
        <FormField label="Tiempo de entrega *">
          <SearchableSelect
            className="w-full"
            value={deliveryTimeId}
            onChange={(id) => onChange({ deliveryTimeId: id })}
            required
            placeholder="Seleccionar…"
            options={deliveryTimes.map((d) => ({ value: d.id, label: d.name }))}
          />
        </FormField>
        <FormField label="Condiciones de pago *">
          <SearchableSelect
            className="w-full"
            value={paymentConditionId}
            onChange={(id) => onChange({ paymentConditionId: id })}
            required
            placeholder="Seleccionar…"
            options={paymentConditions.map((p) => ({ value: p.id, label: p.name }))}
          />
        </FormField>
        <FormField label="Términos y condiciones *" className="md:col-span-2">
          <SearchableSelect
            className="w-full"
            value={termsConditionId}
            onChange={(id) => onChange({ termsConditionId: id })}
            required
            placeholder="Seleccionar…"
            options={termsConditions.map((t) => ({ value: t.id, label: t.name }))}
          />
        </FormField>
      </div>
      {selectedTerms?.body && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs whitespace-pre-wrap text-[var(--text-secondary)] max-h-40 overflow-y-auto">
          {selectedTerms.body}
        </div>
      )}
      <FormField label="Observaciones">
        <textarea
          value={observations}
          onChange={(e) => onChange({ observations: e.target.value })}
          rows={2}
          placeholder="Notas adicionales (opcional)"
        />
      </FormField>
    </FormSectionBlock>
  );
}
