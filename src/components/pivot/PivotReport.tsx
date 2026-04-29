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
                  <p>Engenharia dos Sistemas de Irrigação</p>
                </div>
                <div className="rpt-header-right">
                  <strong>Colégio Técnico de Bom Jesus</strong><br />
                  Prof. José Orlando Piauilino Ferreira<br />
                  {dateStr}
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
                <p className="rpt-note">Método: Darcy-Weisbach com fator de atrito Colebrook-White (iterativo). Fator de Christiansen (F) para tubulações com múltiplas saídas.</p>
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
                    <div className="rpt-section-title">3. Método Trecho a Trecho — Emissor por Emissor</div>
                    <div className="rpt-grid rpt-grid-4" style={{ marginBottom: "8px" }}>
                      <div className="rpt-field"><label>Espaç. emissores (Eem)</label><span className="v">{trechoState.Eem} m</span></div>
                      <div className="rpt-field"><label>Coef. descarga (Cd)</label><span className="v">{trechoState.Cd}</span></div>
                      <div className="rpt-field"><label>Modelo regulador</label><span className="v">{trechoState.modelo || "—"}</span></div>
                      <div className="rpt-field"><label>Parâmetros (a/b/c/d/f)</label><span className="v">{[trechoState.a, trechoState.b, trechoState.c, trechoState.d, trechoState.fParam].filter(Boolean).join(" / ") || "—"}</span></div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Emissor</th>
                          <th>Ri (m)</th>
                          <th>Trecho</th>
                          <th>Di (mm)</th>
                          <th>qi (m³/h)</th>
                          <th>QTrecho (m³/h)</th>
                          <th>Vel. (m/s)</th>
                          <th>NR</th>
                          <th>f</th>
                          <th>Hf (m)</th>
                          <th>Aclive (m)</th>
                          <th>Hi Aclive (mca)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trechoState.rows.slice(0, 60).map((row, i) => (
                          <tr key={i}>
                            <td className="td-em">{row.emissor}</td>
                            <td>{row.Ri}</td>
                            <td>{row.trecho}</td>
                            <td>{row.Di}</td>
                            <td>{row.qi}</td>
                            <td>{row.QTrecho}</td>
                            <td>{row.v}</td>
                            <td>{row.NR}</td>
                            <td>{row.f}</td>
                            <td>{row.hf}</td>
                            <td>{row.Aclive}</td>
                            <td className="td-em">{row.HiAclive}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {trechoState.rows.length > 60 && (
                      <p className="rpt-note">... {trechoState.rows.length - 60} linhas omitidas. Tabela completa disponível na calculadora.</p>
                    )}

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
                        <div className="rlabel">Hpp — Pressão no ponto do Pivô (Método Trecho a Trecho)</div>
                        <div className="rval">{trechoState.hpp} <span className="runit">m.c.a.</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 4. Potência da Bomba ── */}
              {potenciaState.Pb && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">4. Dimensionamento da Motobomba</div>
                    <div className="rpt-grid rpt-grid-2" style={{ marginBottom: "8px" }}>
                      <div>
                        <p className="rpt-seg-title" style={{ marginBottom: "5px" }}>Tubulação Adutora</p>
                        <div className="rpt-grid rpt-grid-2">
                          <div className="rpt-field"><label>Comprimento</label><span className="v">{potenciaState.Lad} m</span></div>
                          <div className="rpt-field"><label>Diâmetro</label><span className="v">{potenciaState.Dad} mm</span></div>
                          <div className="rpt-field"><label>Alt. geom. recalque</label><span className="v">{potenciaState.Zrec || "0"} m</span></div>
                          <div className="rpt-field"><label>Hf adutora</label><span className="v">{potenciaState.Hftadu} m</span></div>
                          <div className="rpt-field"><label>Velocidade</label><span className="v">{potenciaState.Vad_res} m/s</span></div>
                        </div>
                      </div>
                      <div>
                        <p className="rpt-seg-title" style={{ marginBottom: "5px" }}>Tubulação de Sucção</p>
                        <div className="rpt-grid rpt-grid-2">
                          <div className="rpt-field"><label>Comprimento</label><span className="v">{potenciaState.Lsuc} m</span></div>
                          <div className="rpt-field"><label>Diâmetro</label><span className="v">{potenciaState.Dsuc} mm</span></div>
                          <div className="rpt-field"><label>Alt. geom. sucção</label><span className="v">{potenciaState.Zgsuc || "0"} m</span></div>
                          <div className="rpt-field"><label>Hf sucção</label><span className="v">{potenciaState.Hftsuc} m</span></div>
                          <div className="rpt-field"><label>Velocidade</label><span className="v">{potenciaState.Vsuc_res} m/s</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="rpt-grid rpt-grid-3" style={{ marginBottom: "8px" }}>
                      <div className="rpt-field"><label>Rendimento bomba (ηb)</label><span className="v">{potenciaState.nb} %</span></div>
                      <div className="rpt-field"><label>Rendimento motor (ηm)</label><span className="v">{potenciaState.nM} %</span></div>
                      <div className="rpt-field rpt-field-highlight"><label>Alt. manométrica total (Hmt)</label><span className="v">{potenciaState.Hmt} m</span></div>
                    </div>
                    <div className="rpt-formula">
                      P_eixo = (ρ × g × Q × Hmt) / (η_bomba × 735,5) &nbsp;|&nbsp; P_absorvida = P_eixo / η_motor
                    </div>
                    <div className="rpt-result-row">
                      <div className="rpt-result-box">
                        <div className="rlabel">Potência no eixo da bomba</div>
                        <div className="rval">{potenciaState.Pb} <span className="runit">CV</span></div>
                      </div>
                      <div className="rpt-result-box dark">
                        <div className="rlabel">Potência absorvida pelo motor</div>
                        <div className="rval">{potenciaState.Pabs} <span className="runit">CV</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 5. Custo de Energia ── */}
              {custoState.custoFinal && (
                <>
                  <hr className="rpt-divider" />
                  <div className="rpt-section">
                    <div className="rpt-section-title">5. Análise de Custo de Energia</div>
                    <div className="rpt-grid rpt-grid-4" style={{ marginBottom: "8px" }}>
                      <div className="rpt-field"><label>Tarifa horo-sazonal</label><span className="v">{custoState.tarifaHoro}</span></div>
                      <div className="rpt-field"><label>Bandeira tarifária</label><span className="v">{custoState.bandeira}</span></div>
                      <div className="rpt-field"><label>Período</label><span className="v">{custoState.periodo}</span></div>
                      <div className="rpt-field"><label>Dias de trabalho</label><span className="v">{custoState.diasTrabalho} dias</span></div>
                      <div className="rpt-field"><label>Potência demandada</label><span className="v">{custoState.potDemanda} kW</span></div>
                      <div className="rpt-field"><label>Potência absorvida</label><span className="v">{custoState.potAbsorvidaKW} kW</span></div>
                      <div className="rpt-field"><label>Volume bombeado</label><span className="v">{custoState.volumeBombeado} m³</span></div>
                      <div className="rpt-field"><label>Energia total</label><span className="v">{custoState.energiaTotal} kWh</span></div>
                      <div className="rpt-field"><label>Custo de energia</label><span className="v">R$ {custoState.custoEnergia}</span></div>
                      <div className="rpt-field"><label>Custo de demanda</label><span className="v">R$ {custoState.custoDemanda}</span></div>
                      <div className="rpt-field"><label>Custo por m³</label><span className="v">R$ {custoState.custoPorM3}/m³</span></div>
                      <div className="rpt-field"><label>Custo por mm d'água</label><span className="v">R$ {custoState.custoPorMm}/mm</span></div>
                    </div>
                    <div className="rpt-result-box dark" style={{ padding: "12px 16px", borderRadius: "8px" }}>
                      <div className="rlabel">Custo Final de Energia</div>
                      <div className="rval">R$ {custoState.custoFinal}</div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Footer ── */}
              <div className="rpt-footer">
                <div>
                  <strong style={{ color: "#1a4730" }}>Engenharia dos Sistemas de Irrigação</strong><br />
                  Prof. José Orlando Piauilino Ferreira · Colégio Técnico de Bom Jesus
                </div>
                <div style={{ textAlign: "right" }}>
                  Gerado em: {dateStr}<br />
                  Darcy-Weisbach · Colebrook-White · Christiansen
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
