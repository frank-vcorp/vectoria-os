import { VECTORIA_BRAND, brandLogoUrl } from "@/shared/brand-contact";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function documentStyles() {
  const c = VECTORIA_BRAND.colors;
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&display=swap');
    @page {
      size: letter;
      margin: 12mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: Inter, system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: ${c.navy};
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-page {
      width: 100%;
      max-width: 7.5in;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .doc-header {
      background: linear-gradient(135deg, ${c.navy} 0%, #152d5c 100%);
      color: #fff;
      padding: 0.7rem 0.85rem 0.55rem;
      border-radius: 6px 6px 0 0;
    }
    .doc-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .doc-logo-wrap {
      background: #fff;
      border-radius: 6px;
      padding: 0.3rem 0.45rem;
      flex-shrink: 0;
    }
    .doc-logo {
      height: 30px;
      width: auto;
      display: block;
    }
    .doc-header-title {
      flex: 1;
      min-width: 0;
      padding: 0 0.4rem;
    }
    .doc-header-title h1 {
      margin: 0;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 13pt;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .doc-header-title p {
      margin: 0.15rem 0 0;
      font-size: 9pt;
      color: rgb(255 255 255 / 0.82);
      line-height: 1.3;
    }
    .doc-badge {
      flex-shrink: 0;
      padding: 0.35rem 0.55rem;
      border-radius: 6px;
      background: rgb(255 255 255 / 0.12);
      border: 1px solid rgb(255 255 255 / 0.22);
      color: #fff;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-align: right;
      line-height: 1.25;
    }
    .doc-badge span {
      display: block;
      font-size: 7.5pt;
      font-weight: 600;
      opacity: 0.8;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .doc-accent {
      height: 3px;
      background: ${c.orange};
      margin-top: 0.5rem;
    }
    .doc-body {
      flex: 1;
      padding: 0.75rem 0 0.5rem;
    }
    .doc-section-title {
      margin: 0.75rem 0 0.4rem;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: ${c.slate};
    }
    .doc-section-title:first-child { margin-top: 0; }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      font-size: 10pt;
      page-break-inside: auto;
    }
    .doc-table tr { page-break-inside: avoid; page-break-after: auto; }
    .doc-table th,
    .doc-table td {
      text-align: left;
      padding: 0.38rem 0.5rem;
      border-bottom: 1px solid ${c.border};
      vertical-align: top;
      line-height: 1.4;
    }
    .doc-table th {
      width: 32%;
      color: ${c.slate};
      font-weight: 600;
      font-size: 9pt;
      background: ${c.surface};
    }
    .doc-table tr:last-child th,
    .doc-table tr:last-child td { border-bottom: none; }
    .doc-data-table th {
      width: auto;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.35rem 0.45rem;
    }
    .doc-data-table td { font-size: 9.5pt; padding: 0.35rem 0.45rem; }
    .doc-data-table thead { display: table-header-group; }
    .doc-kv-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .doc-inline-table .doc-table th { width: 38%; }
    .doc-card {
      border: 1px solid ${c.border};
      border-radius: 4px;
      padding: 0.35rem 0.45rem;
      margin-bottom: 0.35rem;
      background: ${c.surface};
      page-break-inside: avoid;
      font-size: 9pt;
    }
    .doc-card strong {
      font-family: Montserrat, Inter, sans-serif;
      font-size: 9pt;
      color: ${c.navy};
    }
    .doc-card p { margin: 0.15rem 0 0; line-height: 1.3; }
    .doc-footer {
      margin-top: 0.65rem;
      padding-top: 0.4rem;
      border-top: 1.5px solid ${c.border};
      font-size: 7.5pt;
      line-height: 1.35;
      color: ${c.slate};
      break-inside: avoid;
      break-before: avoid;
      page-break-inside: avoid;
    }
    .doc-footer-line {
      display: block;
      font-size: 7.5pt;
    }
    .doc-footer-line a {
      color: ${c.navy};
      text-decoration: none;
    }
    .doc-footer-sep {
      color: ${c.muted};
      padding: 0 0.25rem;
    }
    .doc-footer-brand {
      margin: 0.2rem 0 0;
      font-size: 7pt;
      color: ${c.muted};
      text-align: center;
    }
    .no-print { margin: 0.75rem 0 0; }
    .no-print button {
      background: ${c.orange};
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 0.75rem;
      font-size: 9pt;
      font-weight: 600;
      cursor: pointer;
      font-family: Inter, sans-serif;
    }
    @media screen {
      body { padding: 0.5rem; background: #eef1f6; }
      .doc-page {
        background: #fff;
        box-shadow: 0 2px 12px rgb(10 31 68 / 0.08);
        padding: 0 0.65rem 0.5rem;
        min-height: 11in;
      }
      .doc-footer { margin-top: auto; }
    }
    @media print {
      html, body { background: #fff; }
      .doc-page {
        max-width: none;
        min-height: 0;
        box-shadow: none;
        padding: 0;
        display: block;
      }
      .doc-body { padding-bottom: 0.25rem; }
      .doc-header { border-radius: 0; }
      .no-print { display: none !important; }
    }
  `;
}

export function renderDocumentFooter() {
  const b = VECTORIA_BRAND;
  return `
    <footer class="doc-footer">
      <div class="doc-footer-line">
        <a href="${b.websiteUrl}">${escapeHtml(b.website)}</a><span class="doc-footer-sep">·</span><a href="mailto:${b.email}">${escapeHtml(b.email)}</a><span class="doc-footer-sep">·</span>${escapeHtml(b.phone)}<span class="doc-footer-sep">·</span><a href="${b.whatsappUrl}">WhatsApp ${escapeHtml(b.whatsapp)}</a><span class="doc-footer-sep">·</span>${escapeHtml(b.address)}
      </div>
      <p class="doc-footer-brand">${escapeHtml(b.name)} · ${escapeHtml(b.tagline)}</p>
    </footer>
  `;
}

export function renderDocumentHeader(logoUrl: string) {
  return `
    <div class="doc-logo-wrap">
      <img class="doc-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(VECTORIA_BRAND.name)}" />
    </div>
  `;
}

export type PrintableDocumentOptions = {
  title: string;
  pageTitle?: string;
  docLabel: string;
  docNumber: string;
  dateLabel?: string;
  dateText: string;
  body: string;
  logoUrl?: string;
  showPrintButton?: boolean;
};

export function wrapPrintableDocument(options: PrintableDocumentOptions) {
  const logoUrl = options.logoUrl ?? brandLogoUrl();
  const pageTitle = options.pageTitle ?? options.title;
  const printBtn =
    options.showPrintButton !== false
      ? `<p class="no-print"><button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
  <style>${documentStyles()}</style>
</head>
<body>
  <div class="doc-page">
    <header class="doc-header">
      <div class="doc-header-row">
        ${renderDocumentHeader(logoUrl)}
        <div class="doc-header-title">
          <h1>${escapeHtml(options.title)}</h1>
          <p>${escapeHtml(options.dateLabel ?? "Fecha")}: ${escapeHtml(options.dateText)}</p>
        </div>
        <div class="doc-badge">
          <span>${escapeHtml(options.docLabel)}</span>
          ${escapeHtml(options.docNumber)}
        </div>
      </div>
      <div class="doc-accent"></div>
    </header>
    <div class="doc-body">
      ${options.body}
    </div>
    ${renderDocumentFooter()}
    ${printBtn}
  </div>
</body>
</html>`;
}

export function renderKeyValueTable(rows: [string, string][]) {
  const renderTable = (chunk: [string, string][]) =>
    `<table class="doc-table">${chunk
      .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
      .join("")}</table>`;

  if (rows.length >= 8) {
    const mid = Math.ceil(rows.length / 2);
    return `<div class="doc-kv-grid doc-inline-table">${renderTable(rows.slice(0, mid))}${renderTable(rows.slice(mid))}</div>`;
  }

  return `<div class="doc-inline-table">${renderTable(rows)}</div>`;
}

export function renderDataTable(headers: string[], rows: string[][]) {
  return `<table class="doc-table doc-data-table">
    <thead><tr>${headers.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("")}</tbody>
  </table>`;
}

export function renderCompactListTable(
  headers: [string, string, string],
  rows: { name: string; detail: string; price: string }[],
) {
  return `<table class="doc-table doc-data-table">
    <thead><tr>
      <th scope="col">${escapeHtml(headers[0])}</th>
      <th scope="col">${escapeHtml(headers[1])}</th>
      <th scope="col">${escapeHtml(headers[2])}</th>
    </tr></thead>
    <tbody>${rows
      .map(
        (r) =>
          `<tr><td><strong>${escapeHtml(r.name)}</strong></td><td>${escapeHtml(r.detail)}</td><td>${escapeHtml(r.price)}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`;
}
