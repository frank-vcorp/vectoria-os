import { ilike, or, type AnyColumn, type SQL } from "drizzle-orm";

export function folioOrClientNameFilter(
  search: string | undefined,
  folioColumn: AnyColumn,
  clientNameColumn: AnyColumn,
): SQL | undefined {
  const term = search?.trim();
  if (!term) return undefined;
  const pattern = `%${term}%`;
  return or(ilike(folioColumn, pattern), ilike(clientNameColumn, pattern));
}
