import type { FieldAnswer, FlowBlock } from "@/shared/surveys";

export function parseFlowExample(example?: string): string[] {
  if (!example?.trim()) return [];
  return example
    .split(/\s*(?:→|->)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function flowBlocksFromExample(example?: string): FlowBlock[] {
  return parseFlowExample(example).map((label, index) => ({
    id: `tpl-${index}-${label.slice(0, 12).replace(/\W+/g, "-").toLowerCase()}`,
    label,
    source: "template",
  }));
}

export function newFlowBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function flowBlocksToArrowText(blocks: FlowBlock[] | undefined) {
  if (!blocks?.length) return "";
  return blocks.map((block) => block.label.trim()).filter(Boolean).join(" → ");
}

export function hasFlowBlocksContent(blocks: FlowBlock[] | undefined) {
  return Boolean(blocks?.some((block) => block.label.trim()));
}

/** Migrates legacy textarea answers into flowBlocks / flowNotes. */
export function coalesceFlowAnswer(answer: FieldAnswer | undefined): FieldAnswer {
  const base = answer ?? {};
  if (hasFlowBlocksContent(base.flowBlocks)) return base;
  const text = base.text?.trim();
  if (!text) return base;
  const parsed = parseFlowExample(text);
  if (parsed.length >= 2) {
    return {
      ...base,
      flowBlocks: parsed.map((label, index) => ({
        id: `legacy-${index}-${label.slice(0, 8).replace(/\W+/g, "-").toLowerCase()}`,
        label,
        source: "custom" as const,
      })),
      text: undefined,
    };
  }
  return { ...base, flowNotes: text, text: undefined };
}
