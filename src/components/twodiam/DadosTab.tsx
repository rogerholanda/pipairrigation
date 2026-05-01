import { useState } from "react";
import { Droplets, Printer } from "lucide-react";
import { printReport, br } from "@/lib/printReport";
import {
  TwoDiamInputs, DadosResult, TWO_DIAM_MATERIALS, TWO_DIAM_PIPE_SIZES,
  fmt, fmtBR, colebrook, calcFluidProps, NumInput, ResultField,
} from "./utils";

interface Props {
  inputs: TwoDiamInputs;
  materialIdx: number;
  onUpdate: (key: keyof TwoDiamInputs, val: string) => void;
  onSetMaterial: (idx: number) => void;
  onResult: (r: DadosResult) => void;
  result: DadosResult | null;
}

export default function DadosTab({ inputs, materialIdx, onUpdate, onSetMaterial, onResult, result }: Props) {
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      const LT = parseFloat(inputs.LT);
      const Easp = parseFloat(inputs.Easp);
      const distpri = parseFloat(inputs.distpri);
      const qem = parseFloat(inputs.qem);
      const rgd = parseFloat(inputs.rgd);
      const Tempa = parseFloat(inputs.Tempa);
      const dq = parseFloat(inputs.dq);
      const Ps = parseFloat(inputs.Ps);
      const hast = parseFloat(inputs.hast);
      const epx = parseFloat(inputs.epx);
      const Dsup = parseFloat(inputs.Dsup);
      const Dinf = parseFloat(inputs.Dinf);
      const Desn = parseFloat(inputs.Desn) || 0;

      if ([LT, Easp, distpri, qem, rgd, Tempa, dq, Ps, hast, epx].some(isNaN)) {
        setError("Preencha todos os campos corretamente.");
        return;
      }

      const { u, uc, mespa, visc } = calcFluidProps(Tempa);

      const dh = fmt(1 - (1 - dq / 100) ** (1 / epx), 4);

      let Hmax: number;
      if (inputs.topology === 'nivel') {
        Hmax = fmt(dh * (Ps + hast) / (1 - 0.75 * dh), 2);
      } else {
        Hmax = fmt((dh * (Ps + hast) - (1 - 0.5 * dh) * Desn) / (1 - 0.75 * dh), 2);
      }

      const varMaxPressao = dh * 100;
      const Ntem = fmt(LT / Easp, 0);
      const fdi = distpri / Easp;
      const Fchr = fmt(1 / 3 + 1 / (2 * Ntem) + 1 / (6 * Ntem ** 2), 3);
      const Faj = fmt((Ntem * Fchr + fdi - 1) / (Ntem + fdi - 1), 3);
      const dHmax = fmt(Hmax / Faj, 2);

      const Qt = fmt(qem * Ntem, 2);
      const Qtot = Qt / 3600;

      const e = rgd / 1000;
      const par1 = e ** 1.25 * (LT * Qtot ** 2 / (9.806 * dHmax)) ** 4.75;
      const par2 = visc * Qtot ** 9.4 * (LT / (9.806 * dHmax)) ** 5.2;
      const Dcalc = fmt(0.66 * (par1 + par2) ** 0.04 * 1000, 2);

      let L1s: number, L2s: number, Ne1s: number, Ne2s: number, Q2s: number;

      if (inputs.method === 'half') {
        Ne1s = Ntem / 2;
        Ne2s = Ntem - Ne1s;
        L1s = (Ne1s - 1) * Easp + distpri;
        L2s = LT - L1s;
        Q2s = fmt(qem * Ne2s, 2);
      } else if (inputs.method === 'deniculi') {
        if (isNaN(Dsup) || isNaN(Dinf)) { setError("Selecione os diâmetros superior e inferior."); return; }
        const rz1 = (Dsup / Dcalc) ** 5 - 1;
        const rz2 = (Dsup / Dinf) ** 5 - 1;
        const rL2 = (rz1 / rz2) ** (1 / 3);
        const seg2 = rL2 * LT;
        const div2 = fmt(seg2 / Easp, 0);
        L2s = div2 * Easp;
        L1s = LT - L2s;
        Ne1s = fmt(L1s / Easp, 0);
        Ne2s = fmt(L2s / Easp, 0);
        Q2s = fmt(Ne2s * qem, 2);
      } else {
        if (isNaN(Dsup) || isNaN(Dinf)) { setError("Selecione os diâmetros superior e inferior."); return; }
        const Vsup = fmt(353.67765 * Qt / Dsup ** 2, 2);
        const NRsup = fmt(mespa * Vsup * Dsup / uc, 0);
        const F = fmt(1 / 3 + 1 / (2 * Ntem) + 1 / (6 * Ntem ** 2), 3);
        const x = distpri / Easp;
        const Fsc = fmt((Ntem * F + x - 1) / (Ntem + x - 1), 3);
        const fs = colebrook(rgd, Dsup, NRsup);
        const Hfsup = fmt(6.376e6 * fs * Fsc * Qt ** 2 * LT / Dsup ** 5, 2);
        const Vinf = fmt(353.67765 * Qt / Dinf ** 2, 2);
        const NRinf = fmt(mespa * Vinf * Dinf / uc, 0);
        const fi = colebrook(rgd, Dinf, NRinf);
        const Hfinf = fmt(6.376e6 * fi * Fsc * Qt ** 2 * LT / Dinf ** 5, 2);
        const Lseg2ratio = ((Hmax - Hfsup) / (Hfinf - Hfsup)) ** (1 / 3);
        const seg2 = Lseg2ratio * LT;
        const div2 = fmt(seg2 / Easp, 0);
        L2s = div2 * Easp;
        L1s = LT - L2s;
        Ne1s = fmt(L1s / Easp, 0);
        Ne2s = fmt(L2s / Easp, 0);
        Q2s = fmt(Ne2s * qem, 2);
      }

      onResult({ Hmax, Ntem, Dcalc, Qt, L1s, L2s, Ne1s, Ne2s, Q2s, varMaxPressao, u, uc, mespa, visc });
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <h3 className="font-display font-semibold text-foreground text-sm">Dados da Tubulação</h3>

      {/* Topografia */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">Topografia</label>
        <div className="flex gap-3">
          {[{ val: 'nivel' as const, label: 'Nível' }, { val: 'aclive' as const, label: 'Aclive' }].map(opt => (
            <button key={opt.val} onClick={() => onUpdate('topology', opt.val)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${inputs.topology === opt.val ? "gradient-primary text-primary-foreground border-transparent shadow-md" : "bg-muted text-muted-foreground border-border hover:border-primary"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Comprimento total (m)" value={inputs.LT} onChange={v => onUpdate('LT', v)} />
        <NumInput label="Desnível do Terreno (m)" value={inputs.Desn} onChange={v => onUpdate('Desn', v)} disabled={inputs.topology === 'nivel'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Espaçamento entre emissores (m)" value={inputs.Easp} onChange={v => onUpdate('Easp', v)} />
        <NumInput label="Vazão do emissor (m³/h)" value={inputs.qem} onChange={v => onUpdate('qem', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Distância do 1° emissores (m)" value={inputs.distpri} onChange={v => onUpdate('distpri', v)} />
        <NumInput label="Exp. do emissor (x)" value={inputs.epx} onChange={v => onUpdate('epx', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Variação máxima da vazão (%)" value={inputs.dq} onChange={v => onUpdate('dq', v)} />
        <NumInput label="P.S. do emissor (m)" value={inputs.Ps} onChange={v => onUpdate('Ps', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">Material do tubo</label>
          <div className="grid grid-cols-3 gap-2">
            {TWO_DIAM_MATERIALS.map((m, i) => (
              <button key={m.label} onClick={() => onSetMaterial(i)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all border ${materialIdx === i ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <NumInput label="Haste do emissor (m)" value={inputs.hast} onChange={v => onUpdate('hast', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Temperatura da água (°C)" value={inputs.Tempa} onChange={v => onUpdate('Tempa', v)} />
        <NumInput label="Rugosidade (mm)" value={inputs.rgd} onChange={v => onUpdate('rgd', v)} />
      </div>

      {/* Diâmetros */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">Diâmetro Superior (mm)</label>
          <select value={inputs.Dsup} onChange={e => onUpdate('Dsup', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}>
            {TWO_DIAM_PIPE_SIZES.map(d => <option key={d} value={d}>{d} mm</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">Diâmetro Inferior (mm)</label>
          <select value={inputs.Dinf} onChange={e => onUpdate('Dinf', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}>
            {TWO_DIAM_PIPE_SIZES.map(d => <option key={d} value={d}>{d} mm</option>)}
          </select>
        </div>
      </div>

      {/* Method selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">Métodos Para Divisão da Tubulação</label>
        <div className="flex flex-col gap-2">
          {[
            { val: 'half' as const, label: 'Método (1/2 a 1/2)' },
            { val: 'deniculi' as const, label: 'Método de Denículi' },
            { val: 'keller' as const, label: 'Método de Keller' },
          ].map(opt => (
            <button key={opt.val} onClick={() => onUpdate('method', opt.val)}
              className={`py-2 px-4 rounded-lg text-sm font-semibold font-body transition-all border text-left ${inputs.method === opt.val ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={calculate}
          className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
          <Droplets size={18} /> CALCULAR
        </button>
        <button
          onClick={() => {
            if (!result) { alert("Calcule primeiro para gerar o relatório."); return; }
            const methodLabel = inputs.method === 'half' ? 'Meio a meio'
              : inputs.method === 'deniculi' ? 'Denículi' : 'Keller';
            printReport({
              calculator: "2 Diâmetros",
              subtitle: "Dimensionamento de tubulação com dois diâmetros",
              sections: [
                {
                  title: "1. Dados de Entrada",
                  rows: [
                    { label: "Comprimento total (LT)", value: br(inputs.LT, "m") },
                    { label: "Espaçam. aspersores (Easp)", value: br(inputs.Easp, "m") },
                    { label: "Distância principal", value: br(inputs.distpri, "m") },
                    { label: "Vazão emissor (qem)", value: br(inputs.qem, "m³/h") },
                    { label: "Material", value: TWO_DIAM_MATERIALS[materialIdx].label },
                    { label: "Rugosidade absoluta (ε)", value: br(inputs.rgd, "mm") },
                    { label: "Temperatura", value: br(inputs.Tempa, "°C") },
                    { label: "Variação de vazão (Δq)", value: br(inputs.dq, "%") },
                    { label: "Pressão de serviço (Ps)", value: br(inputs.Ps, "m.c.a.") },
                    { label: "Altura do tubo (hast)", value: br(inputs.hast, "m") },
                    { label: "Expoente (x)", value: br(inputs.epx) },
                    { label: "Diâmetro superior (Dsup)", value: br(inputs.Dsup, "mm") },
                    { label: "Diâmetro inferior (Dinf)", value: br(inputs.Dinf, "mm") },
                    { label: "Topologia", value: inputs.topology === 'nivel' ? 'Em nível' : 'Em aclive' },
                    ...(inputs.topology === 'aclive' ? [{ label: "Desnível", value: br(inputs.Desn, "m") }] : []),
                    { label: "Método de cálculo", value: methodLabel },
                  ],
                },
                {
                  title: "2. Propriedades do Fluido",
                  rows: [
                    { label: "Viscosidade dinâmica (μ)", value: `${result.uc.toFixed(2)} × 10⁻³ N.s/m²` },
                    { label: "Massa específica (ρ)", value: br(result.mespa.toFixed(2), "kg/m³") },
                  ],
                },
                {
                  title: "3. Resultados Globais",
                  highlightLast: true,
                  rows: [
                    { label: "Decréscimo de carga permitido (Hmax)", value: br(result.Hmax.toFixed(2), "m") },
                    { label: "Nº total de emissores (Ntem)", value: br(String(result.Ntem)) },
                    { label: "Vazão total (Qt)", value: br(result.Qt.toFixed(2), "m³/h") },
                    { label: "Variação máxima de pressão", value: br(result.varMaxPressao.toFixed(0), "%") },
                    { label: "Diâmetro calculado (Dcalc)", value: br(result.Dcalc.toFixed(2), "mm") },
                  ],
                },
                {
                  title: "4. Segmentação dos Diâmetros",
                  rows: [
                    { label: "1º seg. — Comprimento", value: br(result.L1s.toFixed(0), "m") },
                    { label: "1º seg. — Nº de emissores", value: br(String(result.Ne1s)) },
                    { label: "1º seg. — Vazão", value: br(result.Qt.toFixed(2), "m³/h") },
                    { label: "2º seg. — Comprimento", value: br(result.L2s.toFixed(0), "m") },
                    { label: "2º seg. — Nº de emissores", value: br(String(result.Ne2s)) },
                    { label: "2º seg. — Vazão", value: br(result.Q2s.toFixed(2), "m³/h") },
                  ],
                },
              ],
            });
          }}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-semibold font-body flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
          title="Imprimir / Salvar PDF"
        >
          <Printer size={16} />
        </button>
      </div>

      {result && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <ResultField label="Decréscimo de carga permitido (m)" value={fmtBR(result.Hmax, 2)} />
            <ResultField label="Diâmetro calculado (mm)" value={fmtBR(result.Dcalc, 2)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ResultField label="Variação máxima da pressão (%)" value={fmtBR(result.varMaxPressao, 0)} />
            <ResultField label="Vazão total (m³/h)" value={fmtBR(result.Qt, 2)} />
          </div>

          <h4 className="font-display font-semibold text-foreground text-sm pt-2">Cálculos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left"></th>
                  <th className="px-3 py-2 text-right">1° segmento</th>
                  <th className="px-3 py-2 text-right">2° segmento</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-3 py-1.5 text-muted-foreground">Comprimento (m)</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmtBR(result.L1s, 0)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmtBR(result.L2s, 0)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-1.5 text-muted-foreground">Nº de emissores</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{result.Ne1s}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{result.Ne2s}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-1.5 text-muted-foreground">Vazão total (m³/h)</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmtBR(result.Qt, 2)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmtBR(result.Q2s, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
