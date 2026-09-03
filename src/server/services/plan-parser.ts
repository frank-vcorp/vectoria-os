export type ParsedValidationCheck = {
  sortOrder: number;
  text: string;
};

export type ParsedValidationPhase = {
  phaseNumber: number;
  name: string;
  objective: string;
  expectedResult: string;
  checks: ParsedValidationCheck[];
};

export type ParsedValidationPlan = {
  version: string;
  name: string;
  discovery: string;
  phaseCount: number;
  checklistRequired: boolean;
  phases: ParsedValidationPhase[];
};

const REQUIRED_HEADER = "# VECTORIA_PLAN_VALIDACION";
const PHASE_HEADER = /^#\s+Fase\s+(\d+)\s+[—-]\s+(.+)$/im;
const META_LINE = /^([a-z_]+):\s*(.+)$/i;

function parseMetaBlock(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (PHASE_HEADER.test(line)) break;
    const match = line.match(META_LINE);
    if (match) meta[match[1].toLowerCase()] = match[2].trim();
  }
  return meta;
}

function findSectionContent(block: string, header: string): string {
  const pattern = new RegExp(`^##\\s+${header}\\s*$`, "im");
  const match = block.match(pattern);
  if (!match || match.index === undefined) return "";

  const contentStart = match.index + match[0].length;
  const rest = block.slice(contentStart);
  const nextHeader = rest.search(/^##\s+/m);
  return (nextHeader === -1 ? rest : rest.slice(0, nextHeader)).trim();
}

function parseChecks(section: string, phaseNumber: number): ParsedValidationCheck[] {
  if (!section.trim()) {
    throw new Error(`Fase ${phaseNumber}: falta sección ## Comprobaciones`);
  }

  const checks = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line, index) => ({
      sortOrder: index + 1,
      text: line.replace(/^[-*]\s+/, "").trim(),
    }))
    .filter((item) => item.text.length > 0);

  if (checks.length === 0) {
    throw new Error(`Fase ${phaseNumber}: debe existir al menos una Comprobación`);
  }

  return checks;
}

function parseBool(value: string | undefined, field: string): boolean {
  if (value === undefined) throw new Error(`Falta campo obligatorio: ${field}`);
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Valor inválido para ${field}: use true o false`);
}

export function parseValidationPlanMarkdown(content: string): ParsedValidationPlan {
  const trimmed = content.replace(/^\uFEFF/, "").trim();
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim();
  if (firstLine !== REQUIRED_HEADER) {
    throw new Error(`El archivo debe comenzar exactamente con "${REQUIRED_HEADER}"`);
  }

  const meta = parseMetaBlock(trimmed);
  const version = meta.version;
  const name = meta.nombre;
  const discovery = meta.discovery;
  const phaseCountRaw = meta.fases;
  const checklistRaw = meta.checklist_obligatorio;

  if (!version) throw new Error("Falta campo obligatorio: version");
  if (!name) throw new Error("Falta campo obligatorio: nombre");
  if (!discovery) throw new Error("Falta campo obligatorio: discovery");
  if (!phaseCountRaw) throw new Error("Falta campo obligatorio: fases");

  const declaredCount = parseInt(phaseCountRaw, 10);
  if (Number.isNaN(declaredCount)) throw new Error("El campo fases debe ser un número entero");

  const checklistRequired = parseBool(checklistRaw, "checklist_obligatorio");

  const headers = [...trimmed.matchAll(new RegExp(PHASE_HEADER.source, "gim"))];
  if (headers.length < 5) {
    throw new Error(`Se requieren entre 5 y 7 fases; se encontraron ${headers.length}`);
  }
  if (headers.length > 7) {
    throw new Error(`Se requieren entre 5 y 7 fases; se encontraron ${headers.length}`);
  }
  if (headers.length !== declaredCount) {
    throw new Error(
      `El campo fases (${declaredCount}) no coincide con las fases encontradas (${headers.length})`,
    );
  }

  const phases: ParsedValidationPhase[] = headers.map((match, index) => {
    const phaseNumber = parseInt(match[1], 10);
    const expectedNumber = index + 1;
    if (phaseNumber !== expectedNumber) {
      throw new Error(
        `Numeración incorrecta: se esperaba Fase ${expectedNumber}, se encontró Fase ${phaseNumber}`,
      );
    }

    const title = match[2].trim();
    const start = match.index! + match[0].length;
    const next = headers[index + 1]?.index ?? trimmed.length;
    const body = trimmed.slice(start, next);

    const objective = findSectionContent(body, "Objetivo");
    if (!objective) throw new Error(`Fase ${phaseNumber}: falta sección ## Objetivo`);

    const checksSection = findSectionContent(body, "Comprobaciones");
    const checks = parseChecks(checksSection, phaseNumber);

    const expectedResult = findSectionContent(body, "Resultado esperado");
    if (!expectedResult) throw new Error(`Fase ${phaseNumber}: falta sección ## Resultado esperado`);

    return {
      phaseNumber,
      name: title,
      objective,
      expectedResult,
      checks,
    };
  });

  return {
    version,
    name,
    discovery,
    phaseCount: declaredCount,
    checklistRequired,
    phases,
  };
}

/** @deprecated Use parseValidationPlanMarkdown for Plan de Validación imports. */
export function parseDevelopmentPlanMarkdown(content: string, fileName?: string) {
  const parsed = parseValidationPlanMarkdown(content);
  return {
    name: parsed.name || fileName?.replace(/\.(md|txt)$/i, "") || "Plan de Validación",
    version: parsed.version,
    phases: parsed.phases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      name: phase.name,
      objective: phase.objective,
      includes: phase.checks.map((c) => `- ${c.text}`).join("\n"),
      validationCriteria: phase.expectedResult,
    })),
  };
}
