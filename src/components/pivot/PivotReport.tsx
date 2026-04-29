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
}
.rpt-field label {
  display: block;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #777;
  margin-bottom: 2px;
}
.rpt-field label::after { content: " ="; }
.rpt-result-box .rlabel::after { content: " ="; }
.rpt-field .v {
  font-size: 11px;
  font-weight: 600;
  color: #1a4730;
}
.rpt-field-highlight {
  border-color: #2d7a4f;
  background: #eef8f2;
}
.rpt-field-highlight .v { color: #1a4730; font-size: 13px; }

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
                <div className="rpt-grid rpt-grid-4" style={{ marginBottom: "6px" }}>
                  <div className="rpt-field"><label>Raio útil (Rut)</label><span className="v">{inputs.Rut || "—"} m</span></div>
                  <div className="rpt-field"><label>Balanço (Clb)</label><span className="v">{inputs.Clb || "—"} m</span></div>
                  <div className="rpt-field"><label>Lâmina (Lap)</label><span className="v">{inputs.Lap || "—"} mm</span></div>
                  <div className="rpt-field"><label>Tempo irrig. (Tgi)</label><span className="v">{inputs.Tgi || "—"} h</span></div>
                  <div className="rpt-field"><label>Eficiência (Efc)</label><span className="v">{inputs.efc || "—"} %</span></div>
                  <div className="rpt-field"><label>Temperatura</label><span className="v">{inputs.Tempag || "—"} °C</span></div>
                  <div className="rpt-field"><label>Aclive lateral</label><span className="v">{inputs.Aclv || "0"} %</span></div>
                  <div className="rpt-field"><label>Declive lateral</label><span className="v">{inputs.Dclv || "0"} %</span></div>
                  <div className="rpt-field"><label>H final (Hfin)</label><span className="v">{inputs.Hfin || "—"} m.c.a.</span></div>
                  <div className="rpt-field"><label>Material tubulação</label><span className="v">{inputs.material}</span></div>
                  <div className="rpt-field"><label>Rugosidade (ε)</label><span className="v">{inputs.rug} mm</span></div>
                  <div className="rpt-field"><label>Comp. tubo subida</label><span className="v">{inputs.LTs || "—"} m</span></div>
                  <div className="rpt-field"><label>Desnível subida</label><span className="v">{inputs.Alts || "0"} m</span></div>
                  {inputs.hasCanonSpray && (
                    <div className="rpt-field"><label>Vazão canhão (Qc)</label><span className="v">{inputs.Qc} m³/h</span></div>
                  )}
                  <div className="rpt-field" style={{ gridColumn: inputs.hasCanonSpray ? "span 1" : "span 2" }}>
                    <label>Configuração de diâmetros</label><span className="v">{diamLabel}</span>
                  </div>
                </div>
                
              </div>

              {/* ── 2. Método Analítico ── */}
              {results && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">2. Método Analítico — Resultados Globais</div>
                    <div className="rpt-grid rpt-grid-4" style={{ marginBottom: "8px" }}>
                      <div className="rpt-field"><label>Comp. lateral (Lp)</label><span className="v">{results.Lp} m</span></div>
                      <div className="rpt-field"><label>Área básica (Ab)</label><span className="v">{results.Ab} ha</span></div>
                      <div className="rpt-field"><label>Vazão lateral (Qb)</label><span className="v">{results.Qb} m³/h</span></div>
                      <div className="rpt-field"><label>Vazão inicial (Qin)</label><span className="v">{results.Qin} m³/h</span></div>
                      <div className="rpt-field"><label>Razão Qc/Qin</label><span className="v">{results.gr}</span></div>
                      <div className="rpt-field"><label>Comp. equiv. (Leq)</label><span className="v">{results.Leq} m</span></div>
                      <div className="rpt-field"><label>Viscosidade din.</label><span className="v">{results.viscosity} ×10⁻³</span></div>
                      <div className="rpt-field"><label>Massa específica</label><span className="v">{results.density} kg/m³</span></div>
                    </div>

                    {results.segments.map((seg, i) => (
                      <div key={i} className="rpt-seg">
                        <div className="rpt-seg-title">{seg.label} — Ø {seg.d} mm</div>
                        <div className="rpt-grid rpt-grid-4">
                          <div className="rpt-field"><label>Vazão (Q)</label><span className="v">{seg.q} m³/h</span></div>
                          <div className="rpt-field"><label>Velocidade (V)</label><span className="v">{seg.v} m/s</span></div>
                          <div className="rpt-field"><label>Reynolds (NR)</label><span className="v">{seg.nr}</span></div>
                          <div className="rpt-field"><label>Fator atrito (f)</label><span className="v">{seg.f}</span></div>
                          <div className="rpt-field"><label>Christiansen (F)</label><span className="v">{seg.F}</span></div>
                          <div className="rpt-field rpt-field-highlight" style={{ gridColumn: "span 3" }}>
                            <label>Perda de carga — Hf</label><span className="v">{seg.hf} m</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="rpt-grid rpt-grid-2" style={{ marginBottom: "6px" }}>
                      <div className="rpt-field"><label>Hf total na lateral</label><span className="v">{results.Hftotal} m</span></div>
                      <div className="rpt-field"><label>Carga cinética (Hvel)</label><span className="v">{results.Hvel} m</span></div>
                    </div>
                    <div className="rpt-formula">
                      Hf = (6,376 × 10⁶ × f × Q² × L × F) / D⁵ &nbsp;|&nbsp; Ho = Hfin + Hf + (Aclv × Lp / 100) − Hvel &nbsp;|&nbsp; Hpp = Ho + Hf_subida + Alts
                    </div>
                    <div className="rpt-result-row">
                      <div className="rpt-result-box">
                        <div className="rlabel">Pressão no início da lateral — Ho</div>
                        <div className="rval">{results.Hin} <span className="runit">m.c.a.</span></div>
                      </div>
                      <div className="rpt-result-box dark">
                        <div className="rlabel">Pressão no ponto do Pivô — Hpp</div>
                        <div className="rval">{results.Hpp} <span className="runit">m.c.a.</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 3. Método Trecho a Trecho ── */}
              {trechoState.rows.length > 0 && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">3. Método Trecho a Trecho</div>
                    <div className="rpt-grid rpt-grid-4" style={{ marginBottom: "8px" }}>
                      <div className="rpt-field"><label>Espaç. emissores</label><span className="v">{trechoState.Eem} m</span></div>
                      <div className="rpt-field"><label>Coef. descarga</label><span className="v">{trechoState.Cd}</span></div>
                      <div className="rpt-field"><label>Modelo regulador</label><span className="v">{trechoState.modelo || "—"}</span></div>
                      <div className="rpt-field"><label>Parâmetros (a/b/c/d/f)</label><span className="v">{[trechoState.a, trechoState.b, trechoState.c, trechoState.d, trechoState.fParam].filter(Boolean).join(" / ") || "—"}</span></div>
                    </div>

                    <div className="rpt-result-row" style={{ marginTop: "10px" }}>
                      <div className="rpt-result-box" style={{ gridColumn: "1" }}>
                        <div className="rlabel">Hf Total na lateral</div>
                        <div className="rval" style={{ fontSize: "16px" }}>{trechoState.hfTotal} <span className="runit">m</span></div>
                      </div>
                      <div className="rpt-result-box">
                        <div className="rlabel">Ho — Pressão início lateral</div>
                        <div className="rval">{trechoState.h0} <span className="runit">m.c.a.</span></div>
                      </div>
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <div className="rpt-result-box dark" style={{ padding: "12px 16px" }}>
                        <div className="rlabel">Hpp — Pressão no ponto do Pivô</div>
                        <div className="rval">{trechoState.hpp} <span className="runit">m.c.a.</span></div>
                      </div>
                    </div>
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
