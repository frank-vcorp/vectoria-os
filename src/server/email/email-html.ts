import { VECTORIA_BRAND, brandLogoUrl } from "@/shared/brand-contact";
import { escapeHtml } from "@/shared/document-letterhead";

export type BrandedEmailOptions = {
  subjectLine: string;
  greeting?: string;
  bodyParagraphs: string[];
  detailRows?: { label: string; value: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
  logoUrl?: string;
};

export function renderBrandedEmailHtml(options: BrandedEmailOptions) {
  const b = VECTORIA_BRAND;
  const logoUrl = options.logoUrl ?? brandLogoUrl();
  const greeting = options.greeting ?? "Estimado cliente,";
  const paragraphs = options.bodyParagraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(p)}</p>`).join("");
  const details =
    options.detailRows && options.detailRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;border-collapse:collapse;">
          ${options.detailRows
            .map(
              (row) => `<tr>
                <td style="padding:8px 10px;border-bottom:1px solid #e8edf4;font-size:13px;color:#64748b;width:38%;">${escapeHtml(row.label)}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e8edf4;font-size:13px;color:#0A1F44;font-weight:600;">${escapeHtml(row.value)}</td>
              </tr>`,
            )
            .join("")}
        </table>`
      : "";
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;">
          <tr><td>
            <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;background:#D35400;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">${escapeHtml(options.ctaLabel)}</a>
          </td></tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.subjectLine)}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d8dee9;">
          <tr>
            <td style="background:#0A1F44;padding:22px 24px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="display:inline-block;background:#ffffff;border-radius:8px;padding:8px 12px;">
                      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(b.name)}" height="34" style="display:block;height:34px;width:auto;" />
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;font-size:12px;line-height:1.5;color:#cbd5e1;">
                    ${escapeHtml(b.website)}<br />
                    ${escapeHtml(b.email)}
                  </td>
                </tr>
              </table>
              <div style="height:4px;background:#D35400;border-radius:2px;margin-top:16px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 12px;">
              <p style="margin:0 0 8px;font-family:Montserrat,Arial,sans-serif;font-size:20px;font-weight:700;color:#0A1F44;">${escapeHtml(options.subjectLine)}</p>
              <p style="margin:0 0 18px;font-size:14px;color:#64748b;">${escapeHtml(greeting)}</p>
              ${paragraphs}
              ${details}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8edf4;padding-top:16px;">
                <tr>
                  <td style="font-size:12px;line-height:1.6;color:#64748b;">
                    <strong style="color:#0A1F44;">${escapeHtml(b.name)}</strong><br />
                    ${escapeHtml(b.address)}<br />
                    Tel. ${escapeHtml(b.phone)} · WhatsApp ${escapeHtml(b.whatsapp)}<br />
                    <a href="mailto:${b.email}" style="color:#0A1F44;">${escapeHtml(b.email)}</a> ·
                    <a href="${b.websiteUrl}" style="color:#0A1F44;">${escapeHtml(b.website)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBrandedEmailText(options: BrandedEmailOptions) {
  const b = VECTORIA_BRAND;
  const greeting = options.greeting ?? "Estimado cliente,";
  const lines = [
    b.name,
    "—".repeat(40),
    options.subjectLine,
    "",
    greeting,
    "",
    ...options.bodyParagraphs,
    "",
  ];
  if (options.detailRows?.length) {
    for (const row of options.detailRows) {
      lines.push(`${row.label}: ${row.value}`);
    }
    lines.push("");
  }
  lines.push(
    b.address,
    `Tel. ${b.phone}`,
    `WhatsApp ${b.whatsapp}`,
    b.email,
    b.websiteUrl,
  );
  return lines.join("\n");
}
