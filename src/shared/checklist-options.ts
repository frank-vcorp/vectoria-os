import type { FieldAnswer } from "@/shared/surveys";

export function checklistAllOptions(baseOptions: string[] | undefined, answer: FieldAnswer | undefined) {
  const merged = [...(baseOptions ?? [])];
  for (const option of answer?.customOptions ?? []) {
    const trimmed = option.trim();
    if (trimmed && !merged.includes(trimmed)) merged.push(trimmed);
  }
  const legacy = answer?.other?.trim();
  if (legacy && !merged.includes(legacy)) merged.push(legacy);
  return merged;
}

export function isCustomChecklistOption(baseOptions: string[] | undefined, option: string) {
  return !(baseOptions ?? []).includes(option);
}
