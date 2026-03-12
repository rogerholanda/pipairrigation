import { useState } from "react";
import { Droplets } from "lucide-react";
import { TwoDiamInputs, DadosResult, fmt, fmtBR, colebrook, calcFluidProps } from "./utils";

interface KellerRow {
  etapa: number; comp: number; diam: number; vazao: number;
  vel: number; reynolds: number; f: number; hf: number;
  fChr: number; fa: number; hfcor: number;
}
interface AnwarRow {
  seg: number; comp: number; diam: number; vazao: number;
  vel: number; reynolds: number; f: number; hf: number;
  r: number; gAnw: number; gaAnw: number; hfcorAnw: number;
  pSM: number; tSM: number; gSM: number; gaSM: number; hfcorSM: number;
}
interface StepRow {
  emissor: number; trecho: string; comp: number; diam: number;
  vazao: number; vel: number; reynolds: number; f: number;
  hf: number; shf: number;
}
interface ProcResult {
  keller: KellerRow[]; hfKeller: number;
  anwar: AnwarRow[]; hfAnw: number; hfSM: number;
  stepwise: StepRow[]; hfStep: number;
}

interface Props { inputs: TwoDiamInputs; dadosResult: DadosResult | null; }

export default function ProcedimentosTab({ inputs, dadosResult }: Props) {
  const [result, setResult] = useState<ProcResult | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    if (!dadosResult) { setError("Calcule os dados na aba 'Dados' primeiro."); return; }
    try {
      const { Ntem, Qt, L1s, L2s, Ne1s, Ne2s, Q2s } = dadosResult;
      const LT = parseFloat(inputs.LT);
      const Easp = parseFloat(inputs.Easp);
      const distpri = parseFloat(inputs.distpri);
      const qem = parseFloat(inputs.qem);
      const rgd = parseFloat(inputs.rgd);
      const Tempa = parseFloat(inputs.Tempa);
      const Dsup = parseFloat(inputs.Dsup);
      const Dinf = parseFloat(inputs.Dinf);

      const { uc, mespa } = calcFluidProps(Tempa);
      const x = distpri / Easp;

      // ===== Keller & Bliesner =====
      const kellerDef = [
        { etapa: 1, comp: LT, diam: Dsup, vazao: Qt },
        { etapa: 2, comp: L2s, diam: Dsup, vazao: Q2s },
        { etapa: 3, comp: L2s, diam: Dinf, vazao: Q2s },
      ];
      const F1 = fmt(1 / 3 + 1 / (2 * Ntem) + 1 / (6 * Ntem ** 2), 3);
      const F2 = fmt(1 / 3 + 1 / (2 * Ne2s) + 1 / (6 * Ne2s ** 2), 3);
      const Fa1 = fmt((Ntem * F1 + x - 1) / (Ntem + x - 1), 3);

      const keller: KellerRow[] = kellerDef.map((d, idx) => {
        const vel = fmt(353.67765 * d.vazao / d.diam ** 2, 2);
        const reynolds = fmt(mespa * vel * d.diam / uc, 0);
        const f = colebrook(rgd, d.diam, reynolds);
        const fRound = fmt(f, 4);
        const hf = fmt(6.376e6 * fRound * d.vazao ** 2 * d.comp / d.diam ** 5, 2);
        const fChr = idx === 0 ? F1 : F2;
        const fa = idx === 0 ? Fa1 : F2;
        const hfcor = fmt(hf * fa, 2);
        return { etapa: d.etapa, comp: d.comp, diam: d.diam, vazao: d.vazao, vel, reynolds, f: fRound, hf, fChr, fa, hfcor };
      });
      const hfKeller = fmt(keller[0].hfcor - keller[1].hfcor + keller[2].hfcor, 2);

      // ===== Anwar / S&M =====
      const anwarDef = [
        { seg: 1, comp: L1s, diam: Dsup, vazao: Qt },
        { seg: 2, comp: L2s, diam: Dinf, vazao: Q2s },
      ];
      const Q1seg = Ne1s * qem;
      const Q2seg = Ne2s * qem;
      const r = fmt(Q2seg / Q1seg, 2);

      // G factor seg 1 (with r)
      const Neseg = Ne1s;
      const a1 = 1 / (Neseg ** 3 * (1 + r) ** 2);
      const b1 = ((Neseg * (1 + r) + 1) ** 3 - (Neseg * r) ** 3) / 3;
      const c1 = ((Neseg * (1 + r) + 1) ** 2 + (Neseg * r) ** 2) / 2;
      const d1 = (2 * (Neseg * (1 + r) + 1) - 2 * (Neseg * r)) / 12;
      const G1 = fmt(a1 * (b1 - c1 + d1), 3);

      // G factor seg 2 (r=0)
      const Nesg2 = Ne2s;
      const a2 = 1 / Nesg2 ** 3;
      const b2 = ((Nesg2 + 1) ** 3) / 3;
      const c2 = ((Nesg2 + 1) ** 2) / 2;
      const d2v = (2 * (Nesg2 + 1)) / 12;
      const G2 = fmt(a2 * (b2 - c2 + d2v), 3);

      const Ga1 = fmt((Neseg * G1 + x - 1) / (Neseg + x - 1), 3);
      const Ga2 = G2;

      // S&M
      const p1 = fmt(r / (r + 1), 3);
      const t1 = fmt((1 - 1 / Neseg) * (1 - p1), 3);
      const t2 = fmt(1 - 1 / Nesg2, 3);
      const G_SM1 = fmt((1 - (1 - t1) ** 3) / (3 * t1), 3);
      const G_SM2 = fmt((1 - (1 - t2) ** 3) / (3 * t2), 3);
      const Ga_SM1 = fmt((Neseg * G_SM1 + x - 1) / (Neseg + x - 1), 3);
      const Ga_SM2 = G_SM2;

      const anwar: AnwarRow[] = anwarDef.map((d, idx) => {
        const vel = fmt(353.67765 * d.vazao / d.diam ** 2, 2);
        const reynolds = fmt(mespa * vel * d.diam / uc, 0);
        const f = fmt(colebrook(rgd, d.diam, reynolds), 4);
        const hf = fmt(6.376e6 * f * d.vazao ** 2 * d.comp / d.diam ** 5, 2);
        const gAnw = idx === 0 ? G1 : G2;
        const gaAnw = idx === 0 ? Ga1 : Ga2;
        const hfcorAnw = fmt(hf * gaAnw, 3);
        const pSM = idx === 0 ? p1 : 0;
        const tSM = idx === 0 ? t1 : t2;
        const gSM = idx === 0 ? G_SM1 : G_SM2;
        const gaSM = idx === 0 ? Ga_SM1 : Ga_SM2;
        const hfcorSM = fmt(hf * gaSM, 3);
        return { seg: d.seg, comp: d.comp, diam: d.diam, vazao: d.vazao, vel, reynolds, f, hf, r: idx === 0 ? r : 0, gAnw, gaAnw, hfcorAnw, pSM, tSM, gSM, gaSM, hfcorSM };
      });
      const hfAnw = fmt(anwar[0].hfcorAnw + anwar[1].hfcorAnw, 2);
      const hfSM = fmt(anwar[0].hfcorSM + anwar[1].hfcorSM, 2);

      // ===== Passo a Passo (Stepwise) =====
      const Nem = fmt(LT / Easp, 0);
      const Nes2 = fmt(L2s / Easp, 0);
      const stepwise: StepRow[] = [];
      let sqem = 0, SHft = 0;

      for (let i = 0; i < Nem; i++) {
        const emissor = Nem - i;
        const trecho = `${Nem - i - 1} - ${Nem - i}`;
        const comp = i < Nem - 1 ? Easp : distpri;
        const diam = i < Nes2 ? Dinf : Dsup;
        sqem += qem;
        const qtch = fmt(sqem, 2);
        const vel = fmt(353.67765 * qtch / diam ** 2, 2);
        const reynolds = fmt(mespa * vel * diam / uc, 0);
        const f = fmt(colebrook(rgd, diam, reynolds), 4);
        const hf = fmt(6.376e6 * f * qtch ** 2 * comp / diam ** 5, 4);
        SHft += hf;
        stepwise.push({ emissor, trecho, comp, diam, vazao: qtch, vel, reynolds, f, hf, shf: fmt(SHft, 4) });
      }

      setResult({ keller, hfKeller, anwar, hfAnw, hfSM, stepwise, hfStep: fmt(SHft, 2) });
    } catch {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  const TH = "px-2 py-1.5 text-right text-xs font-semibold whitespace-nowrap";
  const TD = "px-2 py-1 text-right text-xs whitespace-nowrap";

  return (
    <div className="p-5 space-y-4">
      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>}

      <button onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
        <Droplets size={18} /> CALCULAR
      </button>

      {result && (
        <div className="space-y-6">
          {/* Keller & Bliesner */}
          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-2">Keller & Bliesner</h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full font-body">
                <thead><tr className="bg-muted">
                  <th className={TH}>Etapas</th><th className={TH}>Comp. (m)</th><th className={TH}>Diâm. (mm)</th>
                  <th className={TH}>Vazão (m³/h)</th><th className={TH}>Vel. (m/s)</th><th className={TH}>Reynolds</th>
                  <th className={TH}>f</th><th className={TH}>Hf (m)</th><th className={TH}>F</th><th className={TH}>Fa</th><th className={TH}>Hfcor (m)</th>
                </tr></thead>
                <tbody>{result.keller.map(r => (
                  <tr key={r.etapa} className="border-b border-border">
                    <td className={TD}>{r.etapa}</td><td className={TD}>{fmtBR(r.comp, 0)}</td><td className={TD}>{fmtBR(r.diam, 1)}</td>
                    <td className={TD}>{fmtBR(r.vazao, 2)}</td><td className={TD}>{fmtBR(r.vel, 2)}</td><td className={TD}>{r.reynolds}</td>
                    <td className={TD}>{fmtBR(r.f, 4)}</td><td className={TD}>{fmtBR(r.hf, 2)}</td><td className={TD}>{fmtBR(r.fChr, 3)}</td>
                    <td className={TD}>{fmtBR(r.fa, 3)}</td><td className={TD}>{fmtBR(r.hfcor, 2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <div className="equation-block px-4 py-2"><span className="text-xs text-muted-foreground font-body mr-2">HfTotal (m)</span><span className="font-display font-bold text-primary">{fmtBR(result.hfKeller, 2)}</span></div>
            </div>
          </div>

          {/* Anwar / S&M */}
          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-2">Anwar / Soleimani & Mirzaei</h4>
            <div className="overflow-x-auto rounded-lg border border-border max-h-60">
              <table className="min-w-[1200px] font-body">
                <thead className="sticky top-0"><tr className="bg-muted">
                  <th className={TH}>Seg.</th><th className={TH}>Comp. (m)</th><th className={TH}>Diâm. (mm)</th>
                  <th className={TH}>Vazão (m³/h)</th><th className={TH}>Vel. (m/s)</th><th className={TH}>Reynolds</th>
                  <th className={TH}>f</th><th className={TH}>Hf (m)</th><th className={TH}>r</th>
                  <th className={TH}>G(Anw)</th><th className={TH}>Ga(Anw)</th><th className={TH}>Hfcor(Anw) (m)</th>
                  <th className={TH}>p(S&M)</th><th className={TH}>t(S&M)</th><th className={TH}>G(S&M)</th>
                  <th className={TH}>Ga(S&M)</th><th className={TH}>Hfcor(S&M) (m)</th>
                </tr></thead>
                <tbody>{result.anwar.map(r => (
                  <tr key={r.seg} className="border-b border-border">
                    <td className={TD}>{r.seg}</td><td className={TD}>{fmtBR(r.comp, 0)}</td><td className={TD}>{fmtBR(r.diam, 1)}</td>
                    <td className={TD}>{fmtBR(r.vazao, 2)}</td><td className={TD}>{fmtBR(r.vel, 2)}</td><td className={TD}>{r.reynolds}</td>
                    <td className={TD}>{fmtBR(r.f, 4)}</td><td className={TD}>{fmtBR(r.hf, 2)}</td><td className={TD}>{fmtBR(r.r, 2)}</td>
                    <td className={TD}>{fmtBR(r.gAnw, 3)}</td><td className={TD}>{fmtBR(r.gaAnw, 3)}</td><td className={TD}>{fmtBR(r.hfcorAnw, 3)}</td>
                    <td className={TD}>{fmtBR(r.pSM, 3)}</td><td className={TD}>{fmtBR(r.tSM, 3)}</td><td className={TD}>{fmtBR(r.gSM, 3)}</td>
                    <td className={TD}>{fmtBR(r.gaSM, 3)}</td><td className={TD}>{fmtBR(r.hfcorSM, 3)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex gap-4 justify-end mt-2">
              <div className="equation-block px-4 py-2"><span className="text-xs text-muted-foreground font-body mr-2">HfTotal/Anw (m)</span><span className="font-display font-bold text-primary">{fmtBR(result.hfAnw, 2)}</span></div>
              <div className="equation-block px-4 py-2"><span className="text-xs text-muted-foreground font-body mr-2">HfTotal/S&M (m)</span><span className="font-display font-bold text-primary">{fmtBR(result.hfSM, 2)}</span></div>
            </div>
          </div>

          {/* Passo a Passo */}
          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-2">Passo a Passo (Stepwise)</h4>
            <div className="overflow-x-auto rounded-lg border border-border max-h-60 overflow-y-auto">
              <table className="w-full font-body">
                <thead className="sticky top-0"><tr className="bg-muted">
                  <th className={TH}>Emissor</th><th className={TH}>Trecho</th><th className={TH}>Comp. (m)</th>
                  <th className={TH}>Diâm. (mm)</th><th className={TH}>Vazão (m³/h)</th><th className={TH}>Vel. (m/s)</th>
                  <th className={TH}>Reynolds</th><th className={TH}>f</th><th className={TH}>Hf (m)</th><th className={TH}>SHf (m)</th>
                </tr></thead>
                <tbody>{result.stepwise.map(r => (
                  <tr key={r.emissor} className="border-b border-border">
                    <td className={TD}>{r.emissor}</td><td className={TD}>{r.trecho}</td><td className={TD}>{r.comp}</td>
                    <td className={TD}>{fmtBR(r.diam, 1)}</td><td className={TD}>{fmtBR(r.vazao, 2)}</td><td className={TD}>{fmtBR(r.vel, 2)}</td>
                    <td className={TD}>{r.reynolds}</td><td className={TD}>{fmtBR(r.f, 4)}</td><td className={TD}>{fmtBR(r.hf, 4)}</td><td className={TD}>{fmtBR(r.shf, 4)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <div className="equation-block px-4 py-2"><span className="text-xs text-muted-foreground font-body mr-2">HfTotal/STPW (m)</span><span className="font-display font-bold text-primary">{fmtBR(result.hfStep, 2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
