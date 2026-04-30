import { useRef } from "react";
import { X, Printer } from "lucide-react";
import { TrechoState } from "./TrechoATrechoCalculator";
import { PotenciaState } from "./PotenciaBombaCalculator";
import { CustoState } from "./CustoEnergiaCalculator";

interface PivotResults {
  Lp: string; Ab: string; Qb: string; Qin: string; gr: string; Leq: string;
  segments: { label: string; hf: string; f: string; v: string; nr: string; q: string; d: string; F: string }[];
  Hftotal: string; Hvel: string; Hin: string; Hpp: string; viscosity: string; density: string;
}

interface Props {
  inputs: {
    Rut: string; Clb: string; Lap: string; Tgi: string; efc: string;
    Tempag: string; material: string; rug: string;
    hasCanonSpray: boolean; Qc: string;
    Hfin: string; Aclv: string; Dclv: string; LTs: string; Alts: string;
    Diu: string; Lseg1_2: string; D2s: string;
    Lseg1_3: string; Lseg2_3: string; Lseg3_3: string; D2s_3: string; D3s_3: string;
    diamConfig: string;
  };
  results: PivotResults | null;
  trechoState: TrechoState;
  potenciaState: PotenciaState;
  custoState: CustoState;
  onClose: () => void;
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
.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 32px;
}

/* ── Header ── */
.rpt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 20px;
  border-bottom: 2px solid #2d7a4f;
}
.rpt-header-left h1 {
  font-size: 16px;
  font-weight: 700;
  color: #1a4730;
  letter-spacing: -0.02em;
}
.rpt-header-left p {
  font-size: 10px;
  color: #555;
  margin-top: 3px;
}
.rpt-header-right {
  text-align: right;
  font-size: 9px;
  color: #666;
  line-height: 1.6;
}
.rpt-header-right strong { color: #1a4730; font-size: 10px; }

/* ── Section ── */
.rpt-section { margin-bottom: 22px; }
.rpt-section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #fff;
  background: #2d7a4f;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.rpt-divider { border: none; border-top: 1px solid #ddd; margin: 18px 0; }

/* ── Info Grid ── */
.rpt-grid {
  display: grid;
  gap: 6px;
}
.rpt-grid-2 { grid-template-columns: 1fr 1fr; }
.rpt-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.rpt-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

.rpt-field {
  border: 1px solid #dde8e2;
  border-radius: 5px;
  padding: 6px 8px;
  background: #f8fdf9;
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.rpt-field label {
  font-size: 9px;
  color: #555;
  font-weight: 500;
}
.rpt-field label::after { content: " ="; font-weight: 700; color: #1a4730; margin-left: 2px; }
.rpt-result-box .rlabel::after { content: " ="; margin-left: 2px; }
.rpt-field .v {
  font-size: 11px;
  font-weight: 600;
  color: #1a4730;
}
.rpt-field-highlight {
  border-color: #2d7a4f;
  background: #eef8f2;
}
.rpt-field-highlight label { font-size: 10px; }
.rpt-field-highlight .v { color: #1a4730; font-size: 13px; }

/* Inline result row: label = value on the same line */
.rpt-inline-result {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  background: #1f5e38;
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
}
.rpt-inline-result .rlabel {
  font-size: 10px;
  opacity: 0.85;
  font-weight: 500;
}
.rpt-inline-result .rlabel::after { content: " ="; }
.rpt-inline-result .rval {
  font-size: 16px;
  font-weight: 700;
  color: #a8e6c1;
}
.rpt-inline-result .runit { font-size: 10px; font-weight: 400; opacity: 0.8; margin-left: 2px; }
.rpt-inline-result.dark { background: #163d25; }

/* Regulator params: each "label = value" on its own line, vertically aligned */
.rpt-reg-params {
  border: 1px solid #dde8e2;
  border-radius: 5px;
  padding: 8px 12px;
  background: #f8fdf9;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rpt-reg-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}
.rpt-reg-row .rp-label {
  font-size: 10px;
  color: #555;
  font-weight: 500;
  min-width: 14px;
  display: inline-block;
}
.rpt-reg-row .rp-label::after { content: " ="; font-weight: 600; color: #333; }
.rpt-reg-row .rp-value {
  font-size: 11px;
  font-weight: 600;
  color: #1a4730;
}

/* ── Result Hero ── */
.rpt-result-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}
.rpt-result-box {
  background: #1f5e38;
  color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
}
.rpt-result-box .rlabel { font-size: 9px; opacity: 0.75; margin-bottom: 4px; }
.rpt-result-box .rval { font-size: 22px; font-weight: 700; color: #a8e6c1; }
.rpt-result-box .runit { font-size: 11px; font-weight: 400; opacity: 0.7; }
.rpt-result-box.dark { background: #163d25; }

/* ── Seg Box ── */
.rpt-seg {
  border: 1px solid #dde8e2;
  border-radius: 6px;
  padding: 9px 10px;
  margin-bottom: 6px;
  background: #fafffe;
}
.rpt-seg-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #2d7a4f;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

/* ── Formula ── */
.rpt-formula {
  background: #f0f7f3;
  border-left: 3px solid #2d7a4f;
  border-radius: 0 4px 4px 0;
  padding: 6px 10px;
  font-size: 9px;
  color: #333;
  margin-top: 8px;
}

/* ── Table ── */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5px;
}
thead tr { background: #1f5e38; }
thead th {
  color: #fff;
  padding: 5px 5px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}
tbody td {
  padding: 3.5px 5px;
  border-bottom: 1px solid #eaf3ed;
  color: #222;
  white-space: nowrap;
}
tbody tr:nth-child(even) td { background: #f5faf7; }
tbody tr:last-child td { border-bottom: none; }
.td-em { font-weight: 600; color: #1a4730; }

/* ── Data Table (Variável | Valor) ── */
.rpt-dtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 8px;
  border: 1px solid #cfe3d6;
  border-radius: 6px;
  overflow: hidden;
}
.rpt-dtable thead th {
  background: #2d7a4f;
  color: #fff;
  text-align: left;
  padding: 6px 10px;
  font-weight: 600;
  font-size: 9.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.rpt-dtable tbody td {
  padding: 5px 10px;
  border-bottom: 1px solid #eaf3ed;
  white-space: normal;
}
.rpt-dtable tbody tr:nth-child(even) td { background: #f5faf7; }
.rpt-dtable tbody tr:last-child td { border-bottom: none; }
.rpt-dtable td.var {
  color: #555;
  width: 60%;
  font-weight: 500;
}
.rpt-dtable td.val {
  color: #1a4730;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.rpt-dtable.highlight tbody tr:last-child td {
  background: #eef8f2;
  color: #1a4730;
  font-weight: 700;
  border-top: 2px solid #2d7a4f;
}
.rpt-subhead {
  font-size: 10px;
  font-weight: 700;
  color: #1a4730;
  margin: 10px 0 6px;
  padding-left: 4px;
  border-left: 3px solid #2d7a4f;
  padding-left: 8px;
}

/* ── Note ── */
.rpt-note { font-size: 8px; color: #888; font-style: italic; margin-top: 5px; }

/* ── Footer ── */
.rpt-footer {
  border-top: 1px solid #ddd;
  padding-top: 10px;
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 8.5px;
  color: #999;
}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export default function PivotReport({ inputs, results, trechoState, potenciaState, custoState, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=960,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório — Pivô Central</title><style>${PRINT_STYLES}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR") + " — " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const diamLabel =
    inputs.diamConfig === "1" ? `1 Diâmetro — Ø${inputs.Diu} mm`
    : inputs.diamConfig === "2" ? `2 Diâmetros — Ø${inputs.Diu} mm / Ø${inputs.D2s} mm`
    : `3 Diâmetros — Ø${inputs.Diu} / Ø${inputs.D2s_3} / Ø${inputs.D3s_3} mm`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-border">

        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={17} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground font-body">Relatório de Dimensionamento — Pivô Central</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold font-body hover:opacity-90 transition-opacity"
            >
              <Printer size={13} />
              Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable preview */}
        <div className="overflow-y-auto flex-1 bg-muted/30 p-6">
          <div ref={printRef}>
            <div className="page">

              {/* ── Header ── */}
              <div className="rpt-header">
                <div className="rpt-header-left">
                  <h1>Dimensionamento Hidráulico — Pivô Central</h1>
                </div>
              </div>

              {/* ── 1. Dados de Entrada ── */}
              <div className="rpt-section">
                <div className="rpt-section-title">1. Dados de Entrada</div>
                <table className="rpt-dtable">
                  <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                  <tbody>
                    <tr><td className="var">Raio útil (Rut)</td><td className="val">{inputs.Rut || "—"} m</td></tr>
                    <tr><td className="var">Balanço (Clb)</td><td className="val">{inputs.Clb || "—"} m</td></tr>
                    <tr><td className="var">Lâmina (Lap)</td><td className="val">{inputs.Lap || "—"} mm</td></tr>
                    <tr><td className="var">Tempo de irrigação (Tgi)</td><td className="val">{inputs.Tgi || "—"} h</td></tr>
                    <tr><td className="var">Eficiência (Efc)</td><td className="val">{inputs.efc || "—"} %</td></tr>
                    <tr><td className="var">Temperatura da água</td><td className="val">{inputs.Tempag || "—"} °C</td></tr>
                    <tr><td className="var">Aclive da lateral</td><td className="val">{inputs.Aclv || "0"} %</td></tr>
                    <tr><td className="var">Declive da lateral</td><td className="val">{inputs.Dclv || "0"} %</td></tr>
                    <tr><td className="var">Pressão final (Hfin)</td><td className="val">{inputs.Hfin || "—"} m.c.a.</td></tr>
                    <tr><td className="var">Material da tubulação</td><td className="val">{inputs.material}</td></tr>
                    <tr><td className="var">Rugosidade (ε)</td><td className="val">{inputs.rug} mm</td></tr>
                    <tr><td className="var">Comprimento tubo de subida (LTs)</td><td className="val">{inputs.LTs || "—"} m</td></tr>
                    <tr><td className="var">Desnível tubo de subida (Alts)</td><td className="val">{inputs.Alts || "0"} m</td></tr>
                    {inputs.hasCanonSpray && (
                      <tr><td className="var">Vazão canhão (Qc)</td><td className="val">{inputs.Qc} m³/h</td></tr>
                    )}
                    <tr><td className="var">Configuração de diâmetros</td><td className="val">{diamLabel}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* ── 2. Método Analítico ── */}
              {results && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">2. Método Analítico — Resultados Globais</div>
                    <table className="rpt-dtable">
                      <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                      <tbody>
                        <tr><td className="var">Comprimento da lateral (Lp)</td><td className="val">{results.Lp} m</td></tr>
                        <tr><td className="var">Área básica (Ab)</td><td className="val">{results.Ab} ha</td></tr>
                        <tr><td className="var">Vazão na lateral (Qb)</td><td className="val">{results.Qb} m³/h</td></tr>
                        <tr><td className="var">Vazão inicial (Qin)</td><td className="val">{results.Qin} m³/h</td></tr>
                        <tr><td className="var">Razão Qc/Qin (gr)</td><td className="val">{results.gr}</td></tr>
                        <tr><td className="var">Comprimento equivalente (Leq)</td><td className="val">{results.Leq} m</td></tr>
                        <tr><td className="var">Viscosidade dinâmica (μ)</td><td className="val">{results.viscosity} ×10⁻³</td></tr>
                        <tr><td className="var">Massa específica (ρ)</td><td className="val">{results.density} kg/m³</td></tr>
                      </tbody>
                    </table>

                    {results.segments.map((seg, i) => (
                      <div key={i}>
                        <div className="rpt-subhead">{seg.label} — Ø {seg.d} mm</div>
                        <table className="rpt-dtable highlight">
                          <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                          <tbody>
                            <tr><td className="var">Vazão (Q)</td><td className="val">{seg.q} m³/h</td></tr>
                            <tr><td className="var">Velocidade (V)</td><td className="val">{seg.v} m/s</td></tr>
                            <tr><td className="var">Número de Reynolds (NR)</td><td className="val">{seg.nr}</td></tr>
                            <tr><td className="var">Fator de atrito (f)</td><td className="val">{seg.f}</td></tr>
                            <tr><td className="var">Fator de Christiansen (F)</td><td className="val">{seg.F}</td></tr>
                            <tr><td className="var">Perda de carga (Hf)</td><td className="val">{seg.hf} m</td></tr>
                          </tbody>
                        </table>
                      </div>
                    ))}

                    <div className="rpt-subhead">Resultados Hidráulicos Finais</div>
                    <table className="rpt-dtable highlight">
                      <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                      <tbody>
                        <tr><td className="var">Hf total na lateral</td><td className="val">{results.Hftotal} m</td></tr>
                        <tr><td className="var">Carga cinética (Hvel)</td><td className="val">{results.Hvel} m</td></tr>
                        <tr><td className="var">Pressão no início da lateral (Ho)</td><td className="val">{results.Hin} m.c.a.</td></tr>
                        <tr><td className="var">Pressão no ponto do Pivô (Hpp)</td><td className="val">{results.Hpp} m.c.a.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── 3. Método Trecho a Trecho ── */}
              {trechoState.rows.length > 0 && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">3. Método Trecho a Trecho</div>
                    <div className="rpt-subhead">Dados de Entrada</div>
                    <table className="rpt-dtable">
                      <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                      <tbody>
                        <tr><td className="var">Espaçamento entre emissores</td><td className="val">{trechoState.Eem} m</td></tr>
                        <tr><td className="var">Coeficiente de descarga</td><td className="val">{trechoState.Cd}</td></tr>
                        <tr><td className="var">Modelo do regulador</td><td className="val">{trechoState.modelo || "—"}</td></tr>
                        <tr><td className="var">Parâmetro a</td><td className="val">{trechoState.a || "—"}</td></tr>
                        <tr><td className="var">Parâmetro b</td><td className="val">{trechoState.b || "—"}</td></tr>
                        <tr><td className="var">Parâmetro c</td><td className="val">{trechoState.c || "—"}</td></tr>
                        <tr><td className="var">Parâmetro d</td><td className="val">{trechoState.d || "—"}</td></tr>
                        <tr><td className="var">Parâmetro f</td><td className="val">{trechoState.fParam || "—"}</td></tr>
                      </tbody>
                    </table>

                    <div className="rpt-subhead">Resultados Hidráulicos</div>
                    <table className="rpt-dtable highlight">
                      <thead><tr><th>Variável</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                      <tbody>
                        <tr><td className="var">Hf Total na lateral</td><td className="val">{trechoState.hfTotal} m</td></tr>
                        <tr><td className="var">Ho — Pressão início lateral</td><td className="val">{trechoState.h0} m.c.a.</td></tr>
                        <tr><td className="var">Hpp — Pressão no ponto do Pivô</td><td className="val">{trechoState.hpp} m.c.a.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}



              {/* ── Footer ── */}
              <div className="rpt-footer">
                <div></div>
                <div style={{ textAlign: "right" }}>
                  Gerado em: {dateStr}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
