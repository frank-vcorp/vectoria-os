import type { ClientCatalogsData, FieldAnswer } from "@/shared/surveys";

export function newOperationCatalogId(prefix = "cat") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function migrateLegacyClientCatalogs(raw: NonNullable<FieldAnswer["clientCatalogs"]>): ClientCatalogsData {
  const catalogs = [...(raw.catalogs ?? [])];
  for (const name of raw.selected ?? []) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    catalogs.push({ id: newOperationCatalogId(), label: trimmed, subcatalogs: [] });
  }
  if (raw.other?.trim()) {
    for (const part of raw.other.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)) {
      catalogs.push({ id: newOperationCatalogId(), label: part, subcatalogs: [] });
    }
  }
  return { catalogs };
}

export function coalesceOperationCatalogs(answer: FieldAnswer | undefined): ClientCatalogsData {
  const raw = answer?.clientCatalogs;
  if (!raw) return { catalogs: [] };
  if (raw.catalogs?.length) return { catalogs: raw.catalogs };
  if (raw.selected?.length || raw.other?.trim()) return migrateLegacyClientCatalogs(raw);
  return { catalogs: [] };
}

export function operationCatalogsHaveContent(data: ClientCatalogsData | undefined) {
  return Boolean(
    data?.catalogs.some((item) => item.label.trim() || item.subcatalogs.some((sub) => sub.label.trim())),
  );
}
