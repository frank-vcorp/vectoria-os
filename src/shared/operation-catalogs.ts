import type { ClientCatalogsData, FieldAnswer, OperationCatalogNode } from "@/shared/surveys";

export function newOperationCatalogId(prefix = "cat") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type LegacyCatalogShape = {
  id?: string;
  label?: string;
  children?: OperationCatalogNode[];
  subcatalogs?: { id: string; label: string }[];
};

function normalizeCatalogNode(raw: LegacyCatalogShape): OperationCatalogNode {
  const children = raw.children?.length
    ? raw.children.map(normalizeCatalogNode)
    : (raw.subcatalogs ?? []).map((sub) => ({ id: sub.id, label: sub.label, children: [] }));
  return {
    id: raw.id ?? newOperationCatalogId(),
    label: raw.label ?? "",
    children,
  };
}

function migrateLegacyClientCatalogs(raw: NonNullable<FieldAnswer["clientCatalogs"]>): ClientCatalogsData {
  const catalogs = [...(raw.catalogs ?? []).map(normalizeCatalogNode)];
  for (const name of raw.selected ?? []) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    catalogs.push({ id: newOperationCatalogId(), label: trimmed, children: [] });
  }
  if (raw.other?.trim()) {
    for (const part of raw.other.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)) {
      catalogs.push({ id: newOperationCatalogId(), label: part, children: [] });
    }
  }
  return { catalogs };
}

export function coalesceOperationCatalogs(answer: FieldAnswer | undefined): ClientCatalogsData {
  const raw = answer?.clientCatalogs;
  if (!raw) return { catalogs: [] };
  if (raw.catalogs?.length) return { catalogs: raw.catalogs.map(normalizeCatalogNode) };
  if (raw.selected?.length || raw.other?.trim()) return migrateLegacyClientCatalogs(raw);
  return { catalogs: [] };
}

export function operationCatalogNodeHasContent(node: OperationCatalogNode | undefined): boolean {
  if (!node) return false;
  if (node.label.trim()) return true;
  return node.children.some(operationCatalogNodeHasContent);
}

export function operationCatalogsHaveContent(data: ClientCatalogsData | undefined) {
  return Boolean(data?.catalogs.some(operationCatalogNodeHasContent));
}

export function mapCatalogTree(
  nodes: OperationCatalogNode[],
  mapper: (node: OperationCatalogNode) => OperationCatalogNode,
): OperationCatalogNode[] {
  return nodes.map((node) => mapper({ ...node, children: mapCatalogTree(node.children, mapper) }));
}

export function updateCatalogNode(
  nodes: OperationCatalogNode[],
  nodeId: string,
  patch: Partial<Pick<OperationCatalogNode, "label">>,
): OperationCatalogNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) return { ...node, ...patch };
    if (node.children.length) return { ...node, children: updateCatalogNode(node.children, nodeId, patch) };
    return node;
  });
}

export function removeCatalogNode(nodes: OperationCatalogNode[], nodeId: string): OperationCatalogNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeCatalogNode(node.children, nodeId) }));
}

export function addCatalogNode(
  nodes: OperationCatalogNode[],
  parentId: string | null,
  label: string,
): OperationCatalogNode[] {
  const trimmed = label.trim();
  if (!trimmed) return nodes;
  const child: OperationCatalogNode = { id: newOperationCatalogId(), label: trimmed, children: [] };
  if (!parentId) return [...nodes, child];
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: [...node.children, child] };
    if (node.children.length) return { ...node, children: addCatalogNode(node.children, parentId, trimmed) };
    return node;
  });
}

export function formatOperationCatalogLines(nodes: OperationCatalogNode[], depth = 0): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    if (!operationCatalogNodeHasContent(node)) continue;
    lines.push(`${"  ".repeat(depth)}- ${node.label.trim() || "(sin nombre)"}`);
    lines.push(...formatOperationCatalogLines(node.children, depth + 1));
  }
  return lines;
}
