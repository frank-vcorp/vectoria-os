import { readFileSync } from "fs";
import { join } from "path";
import { parseValidationPlanMarkdown } from "../src/server/services/plan-parser";

function assertThrows(fn: () => void, includes: string) {
  try {
    fn();
    throw new Error(`Expected error containing "${includes}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Expected error')) throw e;
    if (!msg.includes(includes)) {
      throw new Error(`Expected "${includes}" in "${msg}"`);
    }
  }
}

const validPath = join(process.cwd(), "Docs/plan-validacion-ejemplo.md");
const valid = parseValidationPlanMarkdown(readFileSync(validPath, "utf-8"));

if (valid.phases.length !== 6) throw new Error(`Expected 6 phases, got ${valid.phases.length}`);
if (valid.checklistRequired !== false) throw new Error("checklist_obligatorio should be false");
if (valid.phases[0].checks.length < 1) throw new Error("Phase 1 needs checks");

console.log("OK: valid plan — 6 fases, checklist_obligatorio=false");

const baseHeader = `# VECTORIA_PLAN_VALIDACION
version: 1.0
nombre: Test
discovery: discovery-vectoria-v1.6.md
fases: 5
checklist_obligatorio: false
`;

const phaseBlock = (n: number, withChecks = true) => `# Fase ${n} — Fase ${n}

## Objetivo
Objetivo ${n}.

## Comprobaciones
${withChecks ? "- Check 1." : ""}

## Resultado esperado
Resultado ${n}.
`;

assertThrows(
  () => parseValidationPlanMarkdown(`${baseHeader}${phaseBlock(1)}`),
  "entre 5 y 7 fases",
);

assertThrows(
  () =>
    parseValidationPlanMarkdown(
      `${baseHeader.replace("fases: 5", "fases: 8")}${Array.from({ length: 8 }, (_, i) => phaseBlock(i + 1)).join("\n")}`,
    ),
  "entre 5 y 7 fases",
);

assertThrows(
  () =>
    parseValidationPlanMarkdown(
      `${baseHeader}${phaseBlock(1, false)}${phaseBlock(2)}${phaseBlock(3)}${phaseBlock(4)}${phaseBlock(5)}`,
    ),
  "falta sección ## Comprobaciones",
);

assertThrows(
  () =>
    parseValidationPlanMarkdown(
      `${baseHeader}${phaseBlock(1).replace("## Objetivo\nObjetivo 1.", "## Objetivo\n")}${phaseBlock(2)}${phaseBlock(3)}${phaseBlock(4)}${phaseBlock(5)}`,
    ),
  "falta sección ## Objetivo",
);

assertThrows(
  () =>
    parseValidationPlanMarkdown(
      `${baseHeader}# Fase 1 — A\n\n## Objetivo\nO1.\n\n## Comprobaciones\n- c1\n\n## Resultado esperado\nR1.\n\n# Fase 2 — B\n\n## Objetivo\nO2.\n\n## Comprobaciones\n- c2\n\n## Resultado esperado\nR2.\n\n# Fase 3 — C\n\n## Objetivo\nO3.\n\n## Comprobaciones\n- c3\n\n## Resultado esperado\nR3.\n\n# Fase 4 — D\n\n## Objetivo\nO4.\n\n## Comprobaciones\n- c4\n\n## Resultado esperado\nR4.\n\n# Fase 6 — F\n\n## Objetivo\nO6.\n\n## Comprobaciones\n- c6\n\n## Resultado esperado\nR6.\n`,
    ),
  "Numeración incorrecta",
);

console.log("OK: rejection cases");
