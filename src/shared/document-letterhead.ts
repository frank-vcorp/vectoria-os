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
    .doc-block {
      border: 1px solid ${c.border};
      border-radius: 6px;
      margin-bottom: 0.65rem;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .doc-block .doc-section-title {
      margin: 0;
      padding: 0.45rem 0.6rem;
      background: ${c.surface};
      border-bottom: 1px solid ${c.border};
    }
    .doc-block-body {
      padding: 0.45rem 0.6rem 0.55rem;
    }
    .doc-terms {
      margin: 0;
      font-size: 9pt;
      line-height: 1.45;
      white-space: pre-wrap;
      color: ${c.navy};
    }
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
  extraStyles?: string;
  bodyClass?: string;
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
  <style>${documentStyles()}${options.extraStyles ?? ""}</style>
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
    <div class="doc-body${options.bodyClass ? ` ${options.bodyClass}` : ""}">
      ${options.body}
    </div>
    ${renderDocumentFooter()}
    ${printBtn}
  </div>
</body>
</html>`;
}

export function renderDocumentBlock(title: string, body: string) {
  return `<div class="doc-block">
    <h2 class="doc-section-title">${escapeHtml(title)}</h2>
    <div class="doc-block-body">${body}</div>
  </div>`;
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

export function quoteDocumentStyles() {
  const c = VECTORIA_BRAND.colors;
  return `
    .quote-doc { display: flex; flex-direction: column; gap: 0.75rem; }
    .quote-summary {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 0.65rem;
      border: 1px solid ${c.border};
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .quote-summary-main {
      flex: 1;
      padding: 0.75rem 0.85rem;
      background: linear-gradient(135deg, ${c.surface} 0%, #fff 100%);
    }
    .quote-summary-main .quote-kicker {
      margin: 0 0 0.2rem;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${c.muted};
    }
    .quote-summary-main .quote-client-name {
      margin: 0;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 14pt;
      font-weight: 700;
      line-height: 1.15;
      color: ${c.navy};
    }
    .quote-summary-main .quote-client-meta {
      margin: 0.35rem 0 0;
      font-size: 9pt;
      color: ${c.slate};
      line-height: 1.4;
    }
    .quote-summary-total {
      min-width: 2.4in;
      padding: 0.75rem 0.85rem;
      background: linear-gradient(160deg, ${c.navy} 0%, #152d5c 100%);
      color: #fff;
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .quote-summary-total .quote-kicker {
      margin: 0 0 0.25rem;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgb(255 255 255 / 0.75);
    }
    .quote-summary-total .quote-total-amount {
      margin: 0;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 16pt;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .quote-summary-total .quote-total-note {
      margin: 0.25rem 0 0;
      font-size: 8pt;
      color: rgb(255 255 255 / 0.72);
    }
    .quote-summary-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      margin: 0.15rem 0 0;
      font-size: 8.5pt;
      line-height: 1.35;
      color: rgb(255 255 255 / 0.82);
    }
    .quote-summary-line span { flex: 1; text-align: left; }
    .quote-summary-line strong {
      font-family: Montserrat, Inter, sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
    }
    .quote-section {
      border: 1px solid ${c.border};
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .quote-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin: 0;
      padding: 0.5rem 0.75rem;
      background: ${c.surface};
      border-bottom: 1px solid ${c.border};
    }
    .quote-section-title {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: ${c.navy};
    }
    .quote-section-title::before {
      content: "";
      width: 3px;
      height: 1rem;
      border-radius: 999px;
      background: ${c.orange};
      flex-shrink: 0;
    }
    .quote-section-body { padding: 0.65rem 0.75rem 0.75rem; }
    .quote-section-body-table { padding: 0; }
    .quote-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem 0.85rem;
    }
    .quote-field { min-width: 0; }
    .quote-field-label {
      display: block;
      margin-bottom: 0.12rem;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${c.muted};
    }
    .quote-field-value {
      display: block;
      font-size: 10pt;
      font-weight: 500;
      color: ${c.navy};
      line-height: 1.35;
      word-break: break-word;
    }
    .quote-field-wide { grid-column: 1 / -1; }
    .quote-implementation {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.75rem;
      align-items: start;
    }
    .quote-implementation-copy { min-width: 0; }
    .quote-service-name {
      margin: 0 0 0.35rem;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: ${c.navy};
    }
    .quote-description {
      margin: 0;
      font-size: 9.5pt;
      line-height: 1.5;
      color: ${c.slate};
      white-space: pre-wrap;
    }
    .quote-meta-line {
      margin: 0.45rem 0 0;
      font-size: 8.5pt;
      color: ${c.muted};
    }
    .quote-price-card {
      min-width: 1.85in;
      padding: 0.65rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgb(211 84 0 / 0.25);
      background: linear-gradient(180deg, rgb(211 84 0 / 0.08) 0%, rgb(211 84 0 / 0.03) 100%);
      text-align: right;
    }
    .quote-price-card .quote-kicker {
      margin: 0 0 0.2rem;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: ${c.orange};
    }
    .quote-price-card .quote-total-amount {
      margin: 0;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 13pt;
      font-weight: 700;
      color: ${c.navy};
    }
    .quote-sub-grid {
      display: grid;
      gap: 0.5rem;
    }
    .quote-sub-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.35rem 0.75rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid ${c.border};
      border-radius: 6px;
      background: #fff;
    }
    .quote-sub-card strong {
      display: block;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 9.5pt;
      color: ${c.navy};
    }
    .quote-sub-card p {
      margin: 0.15rem 0 0;
      grid-column: 1;
      font-size: 9pt;
      line-height: 1.4;
      color: ${c.slate};
    }
    .quote-sub-price {
      grid-row: 1 / span 2;
      grid-column: 2;
      align-self: center;
      text-align: right;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: ${c.navy};
      white-space: nowrap;
    }
    .quote-sub-period {
      display: block;
      margin-top: 0.1rem;
      font-size: 8pt;
      font-weight: 500;
      color: ${c.muted};
    }
    .quote-lines-wrap { overflow: hidden; }
    .quote-lines-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .quote-lines-table th,
    .quote-lines-table td {
      padding: 0.45rem 0.55rem;
      border-bottom: 1px solid ${c.border};
      vertical-align: top;
    }
    .quote-lines-table th {
      background: ${c.surface};
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${c.muted};
      text-align: left;
    }
    .quote-lines-table th:nth-child(n+4),
    .quote-lines-table td.quote-line-money { text-align: right; white-space: nowrap; }
    .quote-lines-table th:first-child,
    .quote-lines-table td.quote-line-num {
      width: 1.6rem;
      text-align: center;
      color: ${c.muted};
      font-weight: 600;
    }
    .quote-lines-table th:nth-child(3),
    .quote-lines-table td.quote-line-type-cell { width: 1.15in; }
    .quote-line-desc strong {
      display: block;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: ${c.navy};
      line-height: 1.25;
    }
    .quote-line-desc span {
      display: block;
      margin-top: 0.15rem;
      font-size: 8.5pt;
      line-height: 1.45;
      color: ${c.slate};
      white-space: pre-wrap;
    }
    .quote-line-type {
      display: inline-block;
      padding: 0.12rem 0.4rem;
      border-radius: 999px;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: rgb(10 31 68 / 0.08);
      color: ${c.navy};
    }
    .quote-line-type-recurring {
      background: rgb(211 84 0 / 0.12);
      color: ${c.orange};
    }
    .quote-line-total {
      font-family: Montserrat, Inter, sans-serif;
      font-weight: 700;
      color: ${c.navy};
    }
    .quote-lines-table tfoot td {
      background: ${c.surface};
      font-size: 8.5pt;
      font-weight: 600;
      color: ${c.navy};
    }
    .quote-lines-foot-row td:first-child { text-align: right; }
    .quote-lines-note {
      margin: 0;
      padding: 0.45rem 0.75rem 0.65rem;
      font-size: 7.5pt;
      line-height: 1.4;
      color: ${c.muted};
    }
    .quote-commercial-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem 0.85rem;
    }
    .quote-status {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: rgb(10 31 68 / 0.08);
      color: ${c.navy};
    }
    .quote-terms-box {
      margin-top: 0.65rem;
      padding: 0.6rem 0.7rem;
      border-radius: 6px;
      border: 1px solid ${c.border};
      background: ${c.surface};
      font-size: 8.5pt;
      line-height: 1.5;
      color: ${c.slate};
      white-space: pre-wrap;
    }
    .quote-terms-title {
      margin: 0 0 0.35rem;
      font-family: Montserrat, Inter, sans-serif;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${c.navy};
    }
    @media print {
      .quote-summary, .quote-section, .quote-sub-card { box-shadow: none; }
    }
  `;
}

export function renderQuoteFieldGrid(rows: [string, string][], wideLabels = new Set(["Descripción", "Observaciones"])) {
  return `<div class="quote-fields">${rows
    .map(
      ([label, value]) =>
        `<div class="quote-field${wideLabels.has(label) ? " quote-field-wide" : ""}">
          <span class="quote-field-label">${escapeHtml(label)}</span>
          <span class="quote-field-value">${escapeHtml(value)}</span>
        </div>`,
    )
    .join("")}</div>`;
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
