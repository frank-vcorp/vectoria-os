import Link from "next/link";

const SAMPLES = [
  { href: "/muestra-documentos/cotizacion", title: "Cotización", desc: "PDF imprimible con membrete" },
  { href: "/muestra-documentos/orden-servicio", title: "Orden de servicio", desc: "PDF imprimible con membrete" },
  { href: "/muestra-documentos/correo", title: "Correo SendGrid", desc: "Vista previa HTML del correo" },
  { href: "/samples/cotizacion-muestra.html", title: "Cotización (estático)", desc: "Archivo HTML en public/samples" },
];

export default function MuestraDocumentosIndexPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Muestras de documentos VectorIA</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Datos de ejemplo. Usa Imprimir / Guardar PDF en cada documento para ver el resultado final.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
        {SAMPLES.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "0.85rem 1rem",
                border: "1px solid #d8dee9",
                borderRadius: 10,
                textDecoration: "none",
                color: "#0a1f44",
              }}
            >
              <strong>{s.title}</strong>
              <span style={{ display: "block", fontSize: "0.8125rem", color: "#64748b", marginTop: 4 }}>
                {s.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
