export type ParsedPlanPhase = {
  phaseNumber: number;
  name: string;
  objective: string;
  includes: string;
  validationCriteria: string;
};

export type ParsedDevelopmentPlan = {
  name: string;
  version?: string;
  phases: ParsedPlanPhase[];
};

const PHASE_HEADER = /^#\s+Fase\s+(\d+)\s+[—-]\s+(.+)$/im;
const OBJECTIVE_HEADER = /^##\s+Objetivo\s*$/im;
const INCLUDES_HEADER = /^##\s+Incluye\s*$/im;
const VALIDATION_HEADER = /^##\s+Validaci[oó]n de salida\s*$/im;
const SECTION_HEADER = /^##\s+/m;

function sliceBetween(text: string, start: number, end: number): string {
  return text.slice(start, end).trim();
}

function findSectionContent(block: string, headerPattern: RegExp): { content: string; endIndex: number } | null {
  const match = block.match(headerPattern);
  if (!match || match.index === undefined) return null;

  const contentStart = match.index + match[0].length;
  const rest = block.slice(contentStart);
  const nextHeader = rest.search(/^##\s+/m);
  const content = nextHeader === -1 ? rest : rest.slice(0, nextHeader);
  const endIndex = contentStart + (nextHeader === -1 ? rest.length : nextHeader);

  return { content: content.trim(), endIndex };
}

function buildIncludesFallback(block: string, objectiveEnd: number, validationStart: number): string {
  const middle = sliceBetween(block, objectiveEnd, validationStart === -1 ? block.length : validationStart);
  return middle.replace(/^##\s+[^\n]+\n?/gm, (heading) => heading.trim()).trim();
}

export function parseDevelopmentPlanMarkdown(content: string, fileName?: string): ParsedDevelopmentPlan {
  const versionMatch = content.match(/\*\*Versi[oó]n:\*\*\s*([^\n]+)/i);
  const titleMatch = content.match(/^#\s+Plan de Desarrollo[^\n]*/im);

  const name =
    titleMatch?.[0].replace(/^#\s+/, "").trim() ||
    fileName?.replace(/\.(md|txt)$/i, "") ||
    "Plan de Desarrollo";

  const headers = [...content.matchAll(new RegExp(PHASE_HEADER.source, "gim"))];

  if (headers.length === 0) {
    throw new Error("No se encontraron fases. Use el formato: # Fase 1 — Nombre");
  }

  if (headers.length > 7) {
    throw new Error(`Máximo 7 fases permitidas; se encontraron ${headers.length}`);
  }

  const phases: ParsedPlanPhase[] = headers.map((match, i) => {
    const number = parseInt(match[1], 10);
    const title = match[2].trim();
    const start = match.index! + match[0].length;
    const next = headers[i + 1]?.index ?? content.length;
    let body = content.slice(start, next);

    const trailingDoc = body.search(/\n#\s+(?!#)(?!Fase\s+\d)/i);
    if (trailingDoc !== -1) {
      body = body.slice(0, trailingDoc);
    }

    const objectiveSection = findSectionContent(body, OBJECTIVE_HEADER);
    const includesSection = findSectionContent(body, INCLUDES_HEADER);
    const validationSection = findSectionContent(body, VALIDATION_HEADER);

    const objective = objectiveSection?.content ?? "";
    if (!objective) {
      throw new Error(`Fase ${number}: falta sección ## Objetivo`);
    }

    const validationStart = body.search(VALIDATION_HEADER);
    let includes = includesSection?.content ?? "";

    if (!includes) {
      includes = buildIncludesFallback(body, objectiveSection!.endIndex, validationStart);
    }

    if (!includes) {
      throw new Error(`Fase ${number}: falta contenido de alcance (## Incluye o secciones intermedias)`);
    }

    return {
      phaseNumber: number,
      name: title,
      objective,
      includes,
      validationCriteria: validationSection?.content ?? "",
    };
  });

  return {
    name,
    version: versionMatch?.[1]?.trim(),
    phases,
  };
}
