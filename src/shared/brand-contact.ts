/** Datos de contacto y marca para documentos imprimibles y correos. */
export const VECTORIA_BRAND = {
  name: "VectorIA",
  tagline: "Soluciones tecnológicas",
  website: "vector-ia.mx",
  websiteUrl: "https://vector-ia.mx",
  phone: "+52 1 442 453 2415",
  whatsapp: "+52 1 442 453 2415",
  whatsappUrl: "https://wa.me/524424532415",
  email: "contacto@vector-ia.mx",
  address: "Circuito Puerta del Sol 755, Cd. del Sol, Querétaro, Qro.",
  colors: {
    navy: "#0A1F44",
    orange: "#D35400",
    slate: "#2C3E50",
    muted: "#64748B",
    border: "#D8DEE9",
    surface: "#F6F8FB",
  },
} as const;

/** URL pública del logo para correos y PDFs absolutos. */
export function brandLogoUrl(baseUrl?: string) {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://vectoria-os.vector-ia.mx").replace(/\/$/, "");
  return `${base}/logo.png`;
}
