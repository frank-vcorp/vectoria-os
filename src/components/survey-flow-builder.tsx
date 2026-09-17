"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  flowBlocksFromExample,
  flowBlocksToArrowText,
  newFlowBlockId,
} from "@/shared/flow-blocks";
import type { FlowBlock } from "@/shared/surveys";

type SurveyFlowBuilderProps = {
  label: string;
  example?: string;
  hint?: string;
  blocks: FlowBlock[] | undefined;
  notes?: string;
  disabled?: boolean;
  onChange: (next: { flowBlocks: FlowBlock[]; flowNotes?: string }) => void;
};

export function SurveyFlowBuilder({
  label,
  example,
  hint,
  blocks,
  notes = "",
  disabled = false,
  onChange,
}: SurveyFlowBuilderProps) {
  const templateBlocks = useMemo(() => flowBlocksFromExample(example), [example]);
  const persisted = blocks !== undefined && blocks.length > 0;
  const [draft, setDraft] = useState<FlowBlock[]>(() =>
    persisted ? (blocks ?? []) : templateBlocks.map((block) => ({ ...block })),
  );
  const [draftNotes, setDraftNotes] = useState(notes);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [committed, setCommitted] = useState(persisted);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (persisted) {
      setDraft(blocks ?? []);
      setDraftNotes(notes);
    }
  }, [blocks, notes, persisted]);

  function commit(nextBlocks: FlowBlock[], nextNotes = draftNotes) {
    setCommitted(true);
    setDraft(nextBlocks);
    onChange({ flowBlocks: nextBlocks, flowNotes: nextNotes.trim() || undefined });
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId || disabled) return;
    const fromIndex = draft.findIndex((block) => block.id === fromId);
    const toIndex = draft.findIndex((block) => block.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...draft];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commit(next);
  }

  function updateLabel(id: string, labelValue: string) {
    commit(
      draft.map((block) => (block.id === id ? { ...block, label: labelValue } : block)),
    );
  }

  function removeBlock(id: string) {
    commit(draft.filter((block) => block.id !== id));
  }

  function addBlock() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    commit([...draft, { id: newFlowBlockId(), label: trimmed, source: "custom" }]);
    setNewLabel("");
  }

  function resetToTemplate() {
    if (disabled) return;
    commit(templateBlocks.map((block) => ({ ...block })), draftNotes);
  }

  return (
    <fieldset className="survey-flow-builder space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      {!persisted && templateBlocks.length > 0 ? (
        <p className="text-xs text-[var(--muted)] italic">
          Arrastre, edite o agregue etapas. El ejemplo no se guarda hasta que confirme el flujo.
        </p>
      ) : null}

      <div className="survey-flow-track" aria-label="Secuencia del flujo">
        {draft.map((block, index) => (
          <div key={block.id} className="survey-flow-item">
            {index > 0 ? <span className="survey-flow-arrow" aria-hidden="true">→</span> : null}
            <div
              className={`survey-flow-block${dragId === block.id ? " dragging" : ""}`}
              draggable={!disabled}
              onDragStart={() => setDragId(block.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorder(dragId, block.id);
                setDragId(null);
              }}
            >
              <span className="survey-flow-grip" aria-hidden="true" title="Arrastrar">
                ⋮⋮
              </span>
              <input
                className="survey-flow-label"
                value={block.label}
                disabled={disabled}
                onChange={(e) => updateLabel(block.id, e.target.value)}
                aria-label={`Etapa ${index + 1}`}
              />
              {!disabled && draft.length > 1 ? (
                <button
                  type="button"
                  className="survey-flow-remove"
                  aria-label={`Quitar ${block.label}`}
                  onClick={() => removeBlock(block.id)}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--muted)] font-mono break-words">
        Vista: {flowBlocksToArrowText(draft) || "—"}
      </p>

      {!disabled && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            placeholder="Nueva etapa / tarea"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBlock();
              }
            }}
          />
          <button type="button" className="btn btn-ghost text-sm" onClick={addBlock}>
            + Agregar etapa
          </button>
          {templateBlocks.length > 0 ? (
            <button type="button" className="btn btn-ghost text-sm" onClick={resetToTemplate}>
              Restablecer ejemplo
            </button>
          ) : null}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs text-[var(--muted)]">Notas sobre cómo se realiza (opcional)</span>
        <textarea
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          rows={Math.max(2, draftNotes.split("\n").length)}
          disabled={disabled}
          value={draftNotes}
          onChange={(e) => {
            const nextNotes = e.target.value;
            setDraftNotes(nextNotes);
            if (committed) {
              onChange({ flowBlocks: draft, flowNotes: nextNotes.trim() || undefined });
            }
          }}
          placeholder="Detalle adicional del flujo, excepciones o reglas…"
        />
      </label>
    </fieldset>
  );
}
