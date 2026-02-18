import { useRef } from "react";
import { X, Printer, Droplets } from "lucide-react";
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

export default function PivotReport({ inputs, results, trechoState, potenciaState, custoState, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <title>Relatório — Pivô Central</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a2e1a; background: #fff; }
          .report { max-width: 850px; margin: 0 auto; padding: 24px; }
          .header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #2d7a4f; padding-bottom: 16px; margin-bottom: 20px; }
          .header-logo { width: 44px; height: 44px; background: linear-gradient(135deg, #1f5e38, #2d7a4f); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .header-logo svg { width: 24px; height: 24px; fill: none; stroke: white; stroke-width: 2; }
          .header-title h1 { font-size: 18px; font-weight: 700; color: #1f5e38; }
          .header-title p { font-size: 10px; color: #666; margin-top: 2px; }
          .header-meta { margin-left: auto; text-align: right; font-size: 10px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #1f5e38; border-left: 4px solid #2d7a4f; padding-left: 8px; margin-bottom: 10px; background: #f0f7f3; padding: 6px 8px; border-radius: 0 6px 6px 0; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; }
          .card { background: #f5faf7; border: 1px solid #c8e6d4; border-radius: 8px; padding: 8px 10px; }
          .card label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
          .card value, .card .val { font-size: 12px; font-weight: 600; color: #1f5e38; display: block; }
          .card-highlight { background: linear-gradient(135deg, #e8f5ee, #d4eddf); border: 2px solid #2d7a4f; }
          .card-highlight .val { font-size: 15px; color: #1a4730; }
          .result-primary { background: linear-gradient(135deg, #1f5e38, #2d7a4f); color: white; border-radius: 10px; padding: 14px 18px; text-align: center; }
          .result-primary .val-big { font-size: 28px; font-weight: 700; color: #a8e6c1; }
          .result-primary .val-label { font-size: 10px; opacity: 0.8; margin-bottom: 4px; }
          .result-primary .val-unit { font-size: 13px; font-weight: 400; opacity: 0.7; }
          .seg-box { border: 1px solid #c8e6d4; border-radius: 8px; padding: 10px; margin-bottom: 8px; background: #fafffe; }
          .seg-title { font-size: 10px; font-weight: 700; color: #1f5e38; text-transform: uppercase; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; }
          th { background: #1f5e38; color: white; padding: 5px 4px; text-align: left; font-weight: 600; }
          td { padding: 4px; border-bottom: 1px solid #e0f0e8; }
          tr:nth-child(even) td { background: #f5faf7; }
          tr:last-child td { border-bottom: none; }
          .footer { border-top: 2px solid #c8e6d4; padding-top: 12px; margin-top: 24px; display: flex; justify-content: space-between; font-size: 9px; color: #888; }
          .badge { display: inline-block; background: #e8f5ee; border: 1px solid #2d7a4f; color: #1f5e38; border-radius: 20px; padding: 2px 8px; font-size: 9px; font-weight: 600; }
          .divider { border: none; border-top: 1px solid #e0f0e8; margin: 12px 0; }
          .formula-box { background: #f0f7f3; border-left: 3px solid #2d7a4f; border-radius: 0 6px 6px 0; padding: 6px 10px; font-size: 10px; color: #1f5e38; margin: 4px 0; }
          .note { font-size: 9px; color: #888; font-style: italic; margin-top: 4px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR") + " · " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const diamLabel = inputs.diamConfig === "1" ? `1 Diâmetro — Ø${inputs.Diu} mm`
    : inputs.diamConfig === "2" ? `2 Diâmetros — Ø${inputs.Diu} / Ø${inputs.D2s} mm`
    : `3 Diâmetros — Ø${inputs.Diu} / Ø${inputs.D2s_3} / Ø${inputs.D3s_3} mm`;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-elegant w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-foreground">Relatório de Dimensionamento — Pivô Central</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Printer size={14} />
              Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4">
          <div ref={printRef}>
            {/* ---- PRINT CONTENT ---- */}
            <div className="report">

              {/* Header */}
              <div className="header">
                <div className="header-logo">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6 8 4 12 4 14a8 8 0 0016 0c0-2-2-6-8-12z"/></svg>
                </div>
                <div className="header-title">
                  <h1>Relatório de Dimensionamento Hidráulico</h1>
                  <p>Pivô Central · Engenharia dos Sistemas de Irrigação</p>
                </div>
                <div className="header-meta">
                  <div><strong>Colégio Técnico de Bom Jesus</strong></div>
                  <div>Prof. José Orlando Piauilino Ferreira</div>
                  <div style={{marginTop: "4px"}}>{dateStr}</div>
                </div>
              </div>

              {/* 1. Dados de Entrada */}
              <div className="section">
                <div className="section-title">1. Dados de Entrada do Sistema</div>
                <div className="grid2">
                  <div>
                    <div className="grid2" style={{marginBottom: "8px"}}>
                      <div className="card"><label>Raio útil (Rut)</label><span className="val">{inputs.Rut || "—"} m</span></div>
                      <div className="card"><label>Comp. balanço (Clb)</label><span className="val">{inputs.Clb || "—"} m</span></div>
                      <div className="card"><label>Lâmina aplicada (Lap)</label><span className="val">{inputs.Lap || "—"} mm</span></div>
                      <div className="card"><label>Tempo de irrigação (Tgi)</label><span className="val">{inputs.Tgi || "—"} h</span></div>
                      <div className="card"><label>Eficiência (Efc)</label><span className="val">{inputs.efc || "—"} %</span></div>
                      <div className="card"><label>Temperatura da água</label><span className="val">{inputs.Tempag || "—"} °C</span></div>
                      <div className="card"><label>Aclive lateral (Aclv)</label><span className="val">{inputs.Aclv || "0"} %</span></div>
                      <div className="card"><label>Pressão no final (Hfin)</label><span className="val">{inputs.Hfin || "—"} m.c.a.</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="grid2" style={{marginBottom: "8px"}}>
                      <div className="card"><label>Material da tubulação</label><span className="val">{inputs.material}</span></div>
                      <div className="card"><label>Rugosidade abs. (rug)</label><span className="val">{inputs.rug} mm</span></div>
                      <div className="card"><label>Comp. tubo de subida (LTs)</label><span className="val">{inputs.LTs || "—"} m</span></div>
                      <div className="card"><label>Desnível tubo subida (Alts)</label><span className="val">{inputs.Alts || "0"} m</span></div>
                      {inputs.hasCanonSpray && (
                        <div className="card" style={{gridColumn: "span 2"}}><label>Vazão canhão/spray (Qc)</label><span className="val">{inputs.Qc} m³/h</span></div>
                      )}
                    </div>
                    <div className="card" style={{marginTop: "4px"}}>
                      <label>Configuração de diâmetros</label>
                      <span className="val">{diamLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="note">Método de cálculo: Darcy-Weisbach com fator de atrito por Colebrook-White (iterativo). Fator de Christiansen (F) para tubulações com múltiplas saídas.</div>
              </div>

              <hr className="divider"/>

              {/* 2. Método Analítico */}
              {results && (
                <div className="section">
                  <div className="section-title">2. Método Analítico — Resultados Globais</div>
                  <div className="grid4" style={{marginBottom: "10px"}}>
                    <div className="card"><label>Comp. total lateral (Lp)</label><span className="val">{results.Lp} m</span></div>
                    <div className="card"><label>Área básica (Ab)</label><span className="val">{results.Ab} ha</span></div>
                    <div className="card"><label>Vazão lateral (Qb)</label><span className="val">{results.Qb} m³/h</span></div>
                    <div className="card"><label>Vazão no início (Qin)</label><span className="val">{results.Qin} m³/h</span></div>
                    <div className="card"><label>Razão Qc/Qin (gr)</label><span className="val">{results.gr}</span></div>
                    <div className="card"><label>Comp. equivalente (Leq)</label><span className="val">{results.Leq} m</span></div>
                    <div className="card"><label>Viscosidade cin.</label><span className="val">{results.viscosity} ×10⁻³ N.s/m²</span></div>
                    <div className="card"><label>Massa específica</label><span className="val">{results.density} kg/m³</span></div>
                  </div>

                  {/* Segments */}
                  {results.segments.map((seg, i) => (
                    <div key={i} className="seg-box">
                      <div className="seg-title">{seg.label} — Ø {seg.d} mm</div>
                      <div className="grid4">
                        <div className="card"><label>Vazão (q)</label><span className="val">{seg.q} m³/h</span></div>
                        <div className="card"><label>Velocidade (V)</label><span className="val">{seg.v} m/s</span></div>
                        <div className="card"><label>Reynolds (NR)</label><span className="val">{seg.nr}</span></div>
                        <div className="card"><label>Fat. atrito (f)</label><span className="val">{seg.f}</span></div>
                        <div className="card"><label>Fator Christiansen (F)</label><span className="val">{seg.F}</span></div>
                        <div className="card card-highlight" style={{gridColumn:"span 3"}}><label>Perda de carga — Hf</label><span className="val">{seg.hf} m</span></div>
                      </div>
                    </div>
                  ))}

                  <div className="grid2" style={{marginBottom: "10px"}}>
                    <div className="card"><label>Hf total (m)</label><span className="val">{results.Hftotal} m</span></div>
                    <div className="card"><label>Carga cinética (Hvel)</label><span className="val">{results.Hvel} m</span></div>
                  </div>

                  <div className="formula-box">
                    <strong>Fórmulas aplicadas:</strong><br/>
                    Hf = (6,376×10⁶ × f × Q² × L × F) / D⁵ &nbsp;|&nbsp; Ho = Hfin + Hf_total + (Aclv×Lp/100) − Hvel &nbsp;|&nbsp; Hpp = Ho + Hf_subida + Alts
                  </div>

                  <div className="grid2" style={{marginTop: "10px"}}>
                    <div className="result-primary">
                      <div className="val-label">Pressão no início da lateral — Ho</div>
                      <div className="val-big">{results.Hin} <span className="val-unit">m.c.a.</span></div>
                    </div>
                    <div className="result-primary" style={{background: "linear-gradient(135deg, #1a4730, #1f5e38)"}}>
                      <div className="val-label">Pressão no ponto de pivô — Hpp</div>
                      <div className="val-big">{results.Hpp} <span className="val-unit">m.c.a.</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Método Trecho a Trecho */}
              {trechoState.rows.length > 0 && (
                <div className="section">
                  <hr className="divider"/>
                  <div className="section-title">3. Método Trecho a Trecho — Emissor por Emissor</div>
                  <div className="grid3" style={{marginBottom: "10px"}}>
                    <div className="card"><label>Espaçamento entre emissores</label><span className="val">{trechoState.Eem} m</span></div>
                    <div className="card"><label>Coeficiente de descarga (Cd)</label><span className="val">{trechoState.Cd}</span></div>
                    <div className="card"><label>Modelo regulador</label><span className="val">{trechoState.modelo || "—"}</span></div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Emissor</th><th>Ri (m)</th><th>Trecho</th><th>Di (mm)</th>
                        <th>qi (m³/h)</th><th>Q trecho (m³/h)</th><th>V (m/s)</th>
                        <th>NR</th><th>f</th><th>Hf (m)</th><th>Hi Aclive (m.c.a.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trechoState.rows.slice(0, 80).map((row, i) => (
                        <tr key={i}>
                          <td>{row.emissor}</td><td>{row.Ri}</td><td>{row.trecho}</td><td>{row.Di}</td>
                          <td>{row.qi}</td><td>{row.QTrecho}</td><td>{row.v}</td>
                          <td>{row.NR}</td><td>{row.f}</td><td>{row.hf}</td>
                          <td style={{fontWeight: 600, color: "#1f5e38"}}>{row.HiAclive}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {trechoState.rows.length > 80 && (
                    <div className="note">... {trechoState.rows.length - 80} linhas omitidas por brevidade</div>
                  )}
                  <div className="grid3" style={{marginTop: "10px"}}>
                    <div className="card"><label>Hf total (m)</label><span className="val">{trechoState.hfTotal} m</span></div>
                    <div className="card card-highlight"><label>Ho — Pressão inicial lateral</label><span className="val">{trechoState.h0} m.c.a.</span></div>
                    <div className="result-primary" style={{padding: "10px"}}>
                      <div className="val-label">Hpp — Ponto de pivô</div>
                      <div className="val-big" style={{fontSize:"18px"}}>{trechoState.hpp} <span className="val-unit">m.c.a.</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Potência da Bomba */}
              {potenciaState.Pb && (
                <div className="section">
                  <hr className="divider"/>
                  <div className="section-title">4. Dimensionamento da Bomba</div>
                  <div className="grid2" style={{marginBottom: "8px"}}>
                    <div>
                      <div className="seg-title" style={{fontSize: "10px", marginBottom: "6px"}}>Tubulação Adutora</div>
                      <div className="grid2">
                        <div className="card"><label>Comprimento</label><span className="val">{potenciaState.Lad} m</span></div>
                        <div className="card"><label>Diâmetro</label><span className="val">{potenciaState.Dad} mm</span></div>
                        <div className="card"><label>Alt. geom. de recalque</label><span className="val">{potenciaState.Zrec || "0"} m</span></div>
                        <div className="card"><label>Altura dinâmica recalque</label><span className="val">{potenciaState.Hftadu} m</span></div>
                        <div className="card"><label>Velocidade no recalque</label><span className="val">{potenciaState.Vad_res} m/s</span></div>
                      </div>
                    </div>
                    <div>
                      <div className="seg-title" style={{fontSize: "10px", marginBottom: "6px"}}>Tubulação de Sucção</div>
                      <div className="grid2">
                        <div className="card"><label>Comprimento</label><span className="val">{potenciaState.Lsuc} m</span></div>
                        <div className="card"><label>Diâmetro</label><span className="val">{potenciaState.Dsuc} mm</span></div>
                        <div className="card"><label>Alt. geom. de sucção</label><span className="val">{potenciaState.Zgsuc || "0"} m</span></div>
                        <div className="card"><label>Altura dinâmica sucção</label><span className="val">{potenciaState.Hftsuc} m</span></div>
                        <div className="card"><label>Velocidade na sucção</label><span className="val">{potenciaState.Vsuc_res} m/s</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid4" style={{marginBottom: "8px"}}>
                    <div className="card"><label>Rend. da bomba (ηb)</label><span className="val">{potenciaState.nb} %</span></div>
                    <div className="card"><label>Rend. do motor (ηm)</label><span className="val">{potenciaState.nM} %</span></div>
                    <div className="card card-highlight"><label>Alt. manométrica total (Hmt)</label><span className="val">{potenciaState.Hmt} m</span></div>
                  </div>
                  <div className="formula-box">
                    <strong>Fórmula:</strong> P_eixo = (ρ × g × Q × Hmt) / (η_bomba × 735,5) &nbsp;|&nbsp; P_abs = P_eixo / η_motor
                  </div>
                  <div className="grid2" style={{marginTop: "10px"}}>
                    <div className="result-primary">
                      <div className="val-label">Potência no eixo da bomba</div>
                      <div className="val-big">{potenciaState.Pb} <span className="val-unit">CV</span></div>
                    </div>
                    <div className="result-primary" style={{background: "linear-gradient(135deg, #1a4730, #1f5e38)"}}>
                      <div className="val-label">Potência absorvida pelo motor</div>
                      <div className="val-big">{potenciaState.Pabs} <span className="val-unit">CV</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Custo de Energia */}
              {custoState.custoFinal && (
                <div className="section">
                  <hr className="divider"/>
                  <div className="section-title">5. Análise de Custo de Energia</div>
                  <div className="grid4" style={{marginBottom: "8px"}}>
                    <div className="card"><label>Tarifa horo-sazonal</label><span className="val">{custoState.tarifaHoro}</span></div>
                    <div className="card"><label>Bandeira tarifária</label><span className="val">{custoState.bandeira}</span></div>
                    <div className="card"><label>Período</label><span className="val">{custoState.periodo}</span></div>
                    <div className="card"><label>Dias de trabalho</label><span className="val">{custoState.diasTrabalho} dias</span></div>
                    <div className="card"><label>Potência demandada</label><span className="val">{custoState.potDemanda} kW</span></div>
                    <div className="card"><label>Potência absorvida</label><span className="val">{custoState.potAbsorvidaKW} kW</span></div>
                    <div className="card"><label>Volume bombeado</label><span className="val">{custoState.volumeBombeado} m³</span></div>
                    <div className="card"><label>Energia total</label><span className="val">{custoState.energiaTotal} kWh</span></div>
                    <div className="card"><label>Custo energia (R$)</label><span className="val">R$ {custoState.custoEnergia}</span></div>
                    <div className="card"><label>Custo demanda (R$)</label><span className="val">R$ {custoState.custoDemanda}</span></div>
                    <div className="card"><label>Custo por m³</label><span className="val">R$ {custoState.custoPorM3}/m³</span></div>
                    <div className="card"><label>Custo por mm d'água</label><span className="val">R$ {custoState.custoPorMm}/mm</span></div>
                  </div>
                  <div className="result-primary" style={{gridColumn: "span 2"}}>
                    <div className="val-label">Custo Final de Energia</div>
                    <div className="val-big">R$ {custoState.custoFinal}</div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                <div>
                  <strong>Engenharia dos Sistemas de Irrigação</strong><br/>
                  Prof. José Orlando Piauilino Ferreira · Colégio Técnico de Bom Jesus
                </div>
                <div style={{textAlign: "right"}}>
                  Gerado em: {dateStr}<br/>
                  Equações: Darcy-Weisbach · Colebrook-White · Christiansen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
