// ─────────────────────────────────────────────────────────────────────
// Utilitário compartilhado para geração de relatórios PDF (via window.print)
// Mantém o mesmo padrão visual do PivotReport (header verde, tabelas variável/valor).
// ─────────────────────────────────────────────────────────────────────

export interface ReportRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ReportSection {
  title: string;
  /** Linhas em formato "Variável | Valor" */
  rows: ReportRow[];
  /** Texto opcional exibido logo abaixo do título */
  subtitle?: string;
  /** Se true, último valor recebe destaque (cor primária + borda superior). */
  highlightLast?: boolean;
}

export interface ReportConfig {
  /** Título da calculadora ex: "Colebrook" */
  calculator: string;
  /** Subtítulo opcional ex: "Cálculo de perda de carga" */
  subtitle?: string;
  /** Seções do relatório (na ordem) */
  sections: ReportSection[];
}

const PRINT_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 10px;
  color: #1a1a1a;
  background: #fff;
  line-height: 1.4;
}
.page { max-width: 820px; margin: 0 auto; padding: 28px 32px; }

/* Header */
.rpt-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding-bottom: 14px; margin-bottom: 20px;
  border-bottom: 2px solid #2d7a4f;
}
.rpt-header-left h1 {
  font-size: 16px; font-weight: 700; color: #1a4730; letter-spacing: -0.02em;
}
.rpt-header-left p {
  font-size: 10px; color: #555; margin-top: 3px;
}
.rpt-header-right {
  text-align: right; font-size: 9px; color: #666; line-height: 1.6;
}
.rpt-header-right strong { color: #1a4730; font-size: 10px; }

/* Sections */
.rpt-section { margin-bottom: 18px; }
.rpt-section-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #fff; background: #2d7a4f;
  padding: 5px 10px; border-radius: 4px; margin-bottom: 8px;
}
.rpt-section-subtitle {
  font-size: 9.5px; color: #555; margin: 0 0 8px 4px; font-style: italic;
}

/* Variable | Value table */
.rpt-dtable {
  width: 100%; border-collapse: collapse; font-size: 10px;
  margin-bottom: 6px; border: 1px solid #cfe3d6;
  border-radius: 6px; overflow: hidden;
}
.rpt-dtable thead th {
  background: #2d7a4f; color: #fff; text-align: left;
  padding: 6px 10px; font-weight: 600; font-size: 9.5px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.rpt-dtable tbody td {
  padding: 5px 10px; border-bottom: 1px solid #eaf3ed;
}
.rpt-dtable tbody tr:nth-child(even) td { background: #f5faf7; }
.rpt-dtable tbody tr:last-child td { border-bottom: none; }
.rpt-dtable td.var { color: #555; width: 60%; font-weight: 500; }
.rpt-dtable td.val {
  color: #1a4730; font-weight: 700; text-align: right;
  font-variant-numeric: tabular-nums;
}
.rpt-dtable.highlight tbody tr:last-child td {
  background: #eef8f2; color: #1a4730; font-weight: 700;
  border-top: 2px solid #2d7a4f;
}
.rpt-dtable td.row-hl {
  background: #eef8f2 !important; color: #1a4730; font-weight: 700;
}

/* Footer */
.rpt-footer {
  border-top: 1px solid #ddd; padding-top: 10px; margin-top: 24px;
  display: flex; justify-content: space-between;
  font-size: 8.5px; color: #999;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSection(s: ReportSection): string {
  if (!s.rows.length) return "";
  const rows = s.rows
    .map(
      (r) => `<tr>
        <td class="var${r.highlight ? " row-hl" : ""}">${escapeHtml(r.label)}</td>
        <td class="val${r.highlight ? " row-hl" : ""}">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="rpt-section">
    <div class="rpt-section-title">${escapeHtml(s.title)}</div>
    ${s.subtitle ? `<p class="rpt-section-subtitle">${escapeHtml(s.subtitle)}</p>` : ""}
    <table class="rpt-dtable${s.highlightLast ? " highlight" : ""}">
      <thead><tr><th>Variável</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export function printReport(config: ReportConfig): void {
  const now = new Date();
  const dateStr =
    now.toLocaleDateString("pt-BR") +
    " — " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const sectionsHtml = config.sections.map(renderSection).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório — ${escapeHtml(config.calculator)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="rpt-header">
      <div class="rpt-header-left">
        <h1>Relatório — ${escapeHtml(config.calculator)}</h1>
        ${config.subtitle ? `<p>${escapeHtml(config.subtitle)}</p>` : ""}
      </div>
      <div class="rpt-header-right">
        <strong>Calculadoras Hidráulicas</strong><br />
        Prof José Orlando Piauilino Ferreira<br />
        ${dateStr}
      </div>
    </div>
    ${sectionsHtml}
    <div class="rpt-footer">
      <span>Calculadoras Hidráulicas — Prof José Orlando Piauilino Ferreira</span>
      <span>Gerado em ${dateStr}</span>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) {
    alert("Permita pop-ups para gerar o relatório.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
}

/** Helper para formatar números no padrão brasileiro (vírgula decimal). */
export const br = (v: string | number | undefined | null, suffix = ""): string => {
  if (v === undefined || v === null || v === "" || (typeof v === "number" && isNaN(v))) return "—";
  const s = typeof v === "number" ? String(v) : v;
  const formatted = s.replace(".", ",");
  return suffix ? `${formatted} ${suffix}` : formatted;
};
