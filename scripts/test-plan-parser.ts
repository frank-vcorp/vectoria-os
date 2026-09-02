import { readFileSync } from "fs";
import { join } from "path";
import { parseDevelopmentPlanMarkdown } from "../src/server/services/plan-parser";

const planPath = join(process.cwd(), "Docs/plan-desarrollo-vectoria-v1.0.md");
const content = readFileSync(planPath, "utf-8");
const parsed = parseDevelopmentPlanMarkdown(content, "plan-desarrollo-vectoria-v1.0.md");

if (parsed.phases.length !== 7) {
  throw new Error(`Expected 7 phases, got ${parsed.phases.length}`);
}

console.log(`OK: ${parsed.phases.length} fases parseadas`);
for (const phase of parsed.phases) {
  console.log(`  Fase ${phase.phaseNumber}: ${phase.name}`);
}
