import { SER_V2_MODULE_LINKS } from "@/shared/ser-v2-constants";
import type { FieldAnswer, ModuleLinksData } from "@/shared/surveys";

export function newModuleLinkId(prefix = "lnk") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugLabel(label: string) {
  return label.slice(0, 16).replace(/\W+/g, "-").toLowerCase();
}

export function buildInitialModuleLinks(): ModuleLinksData {
  const links = Object.entries(SER_V2_MODULE_LINKS).flatMap(([group, items]) =>
    items.map((label, index) => ({
      id: `lnk-tpl-${slugLabel(group)}-${index}-${slugLabel(label)}`,
      group,
      label,
      selected: false,
      assigneeId: null,
    })),
  );
  return { links };
}

export function coalesceModuleLinks(answer: FieldAnswer | undefined): ModuleLinksData {
  if (answer?.moduleLinks?.links?.length) return answer.moduleLinks;
  return buildInitialModuleLinks();
}

export function selectedModuleLinks(data: ModuleLinksData | undefined) {
  return (data?.links ?? []).filter((item) => item.selected);
}
