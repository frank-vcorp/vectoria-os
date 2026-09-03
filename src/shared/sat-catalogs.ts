/** Catálogos SAT (CFDI 4.0) — c_RegimenFiscal y c_UsoCFDI (opciones frecuentes). */

export type SatCatalogOption = { code: string; label: string };

export const SAT_REGIMEN_FISCAL: SatCatalogOption[] = [
  { code: "601", label: "601 — General de Ley Personas Morales" },
  { code: "603", label: "603 — Personas Morales con Fines no Lucrativos" },
  { code: "605", label: "605 — Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { code: "606", label: "606 — Arrendamiento" },
  { code: "607", label: "607 — Enajenación o Adquisición de Bienes" },
  { code: "608", label: "608 — Demás ingresos" },
  { code: "610", label: "610 — Residentes Extranjeros sin EP en México" },
  { code: "611", label: "611 — Ingresos por Dividendos" },
  { code: "612", label: "612 — Personas Físicas con Actividad Empresarial y Profesional" },
  { code: "614", label: "614 — Ingresos por intereses" },
  { code: "615", label: "615 — Ingresos por obtención de premios" },
  { code: "616", label: "616 — Sin obligaciones fiscales" },
  { code: "620", label: "620 — Sociedades Cooperativas de Producción" },
  { code: "621", label: "621 — Incorporación Fiscal" },
  { code: "622", label: "622 — Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { code: "623", label: "623 — Opcional para Grupos de Sociedades" },
  { code: "624", label: "624 — Coordinados" },
  { code: "625", label: "625 — Actividades Empresariales vía Plataformas Tecnológicas" },
  { code: "626", label: "626 — Régimen Simplificado de Confianza" },
];

export const SAT_USO_CFDI: SatCatalogOption[] = [
  { code: "G01", label: "G01 — Adquisición de mercancías" },
  { code: "G02", label: "G02 — Devoluciones, descuentos o bonificaciones" },
  { code: "G03", label: "G03 — Gastos en general" },
  { code: "I01", label: "I01 — Construcciones" },
  { code: "I02", label: "I02 — Mobiliario y equipo de oficina por inversiones" },
  { code: "I03", label: "I03 — Equipo de transporte" },
  { code: "I04", label: "I04 — Equipo de cómputo y accesorios" },
  { code: "I08", label: "I08 — Otra maquinaria y equipo" },
  { code: "D01", label: "D01 — Honorarios médicos, dentales y hospitalarios" },
  { code: "D02", label: "D02 — Gastos médicos por incapacidad o discapacidad" },
  { code: "D03", label: "D03 — Gastos funerales" },
  { code: "D04", label: "D04 — Donativos" },
  { code: "D05", label: "D05 — Intereses por créditos hipotecarios" },
  { code: "D06", label: "D06 — Aportaciones voluntarias al SAR" },
  { code: "D07", label: "D07 — Primas por seguros de gastos médicos" },
  { code: "D08", label: "D08 — Gastos de transportación escolar obligatoria" },
  { code: "D09", label: "D09 — Depósitos en cuentas de ahorro / pensiones" },
  { code: "D10", label: "D10 — Pagos por servicios educativos (colegiaturas)" },
  { code: "S01", label: "S01 — Sin efectos fiscales" },
  { code: "CP01", label: "CP01 — Pagos" },
  { code: "CN01", label: "CN01 — Nómina" },
];

export function satLabel(options: SatCatalogOption[], code?: string) {
  if (!code) return "";
  return options.find((o) => o.code === code)?.label ?? code;
}
