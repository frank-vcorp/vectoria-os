/** Datos de contacto y marca para documentos imprimibles y correos. */
export const SYSTRONIA_BRAND = {
  name: "SystronIA",
  tagline: "Inteligencia aplicada a tu negocio",
  website: "systronia.com",
  websiteUrl: "https://systronia.com",
  phone: "+52 1 442 453 2415",
  whatsapp: "+52 1 442 453 2415",
  whatsappUrl: "https://wa.me/524424532415",
  email: "contacto@systronia.com",
  address: "Circuito Puerta del Sol 755, Cd. del Sol, Querétaro, Qro.",
  colors: {
    /** Carbón / texto principal (legado: navy en plantillas). */
    navy: "#1A1D20",
    /** Rojo SystronIA — acento (legado: orange en plantillas). */
    orange: "#B30F1A",
    slate: "#2C3E50",
    muted: "#64748B",
    border: "#D8DEE9",
    surface: "#F6F8FB",
  },
} as const;

/** @deprecated Usar SYSTRONIA_BRAND */
export const VECTORIA_BRAND = SYSTRONIA_BRAND;

/** URL pública del logo para correos y PDFs absolutos. */
export function brandLogoUrl(baseUrl?: string) {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://os.vector-ia.mx").replace(/\/$/, "");
  return `${base}/logo.png`;
}
