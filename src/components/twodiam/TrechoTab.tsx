import { useState } from "react";
import { Droplets } from "lucide-react";
import { TwoDiamInputs, DadosResult, fmt, fmtBR, colebrook, calcFluidProps, NumInput } from "./utils";

interface TrechoRow {
  emissor: number; trecho: string; comp: number; diam: number;
  dist: number; hfl: number; hem: number; qe: number;
  qtch: number; vel: number; reynolds: number; f: number;
  hfTrecho: number; hfAte: number; hEmissor: number;
}
interface TrechoResult {
  rows: TrechoRow[];
  Ho: number; HfTotal: number; varPressao: number; varVazao: number;
  locMsg1: string; locMsg2: string;
}

interface Props { inputs: TwoDiamInputs; dadosResult: DadosResult | null; }

export default function TrechoTab({ inputs, dadosResult }: Props) {
  const [Db1, setDb1] = useState("5");
  const [Db2, setDb2] = useState("2.4");
  const [Cd1, setCd1] = useState("0.91");
  const [Cd2, setCd2] = useState("0.985");
  const [result, setResult] = useState<TrechoResult | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    if (!dadosResult) { setError("Calcule os dados na aba 'Dados' primeiro."); return; }
    try {
      const LT = parseFloat(inputs.LT);
      const Easp = parseFloat(inputs.Easp);
      const distpri = parseFloat(inputs.distpri);
      const rgd = parseFloat(inputs.rgd);
      const Tempa = parseFloat(inputs.Tempa);
      const Ps = parseFloat(inputs.Ps);
      const hast = parseFloat(inputs.hast);
      const epx = parseFloat(inputs.epx);
      const Dsup = parseFloat(inputs.Dsup);
      const Dinf = parseFloat(inputs.Dinf);
      const db1 = parseFloat(Db1);
      const db2 = parseFloat(Db2);
      const cd1 = parseFloat(Cd1);
      const cd2 = parseFloat(Cd2);

      const { L2s } = dadosResult;
      const { uc, mespa } = calcFluidProps(Tempa);

      const Ne = fmt(LT / Easp, 0);
      const Nt = Ne - 1;
      const Nes2 = fmt(L2s / Easp, 0);
      const Hfmax = dadosResult.Hmax;

      // First pass: compute flows based on assumed pressure distribution
      const Hin = Ps + 0.63 * Hfmax + hast;

      const rows: TrechoRow[] = [];
      let sqem = 0, SHft = 0;

      for (let i = 0; i < Ne; i++) {
        const emissor = Ne - i;
        const trecho = `${Ne - i - 1} - ${Ne - i}`;
        const comp = i < Nt ? Easp : distpri;
        const diam = i < Nes2 ? Dinf : Dsup;
        const dist = (Ne - 1 - i) * Easp + distpri;

        const hfl = fmt(Hfmax * (1 - (1 - dist / LT) ** 3), 5);
        const hem = fmt(Hin - hfl, 3);
        const qe = fmt(0.012522 * Math.sqrt(hem) * (cd1 * db1 ** 2 + cd2 * db2 ** 2), 2);

        sqem += qe;
        const qtch = fmt(sqem, 2);
        const vel = fmt(353.67765 * qtch / diam ** 2, 2);
        const reynolds = fmt(mespa * vel * diam / uc, 0);
        const f = fmt(colebrook(rgd, diam, reynolds), 4);
        const hfTrecho = fmt(6.376e6 * f * qtch ** 2 * comp / diam ** 5, 4);
        SHft += hfTrecho;

        rows.push({
          emissor, trecho, comp, diam, dist, hfl, hem, qe, qtch, vel, reynolds, f,
          hfTrecho, hfAte: 0, hEmissor: 0,
        });
      }

      const Hftt = fmt(SHft, 2);
      const Ho = fmt(Ps + 0.63 * Hftt + hast, 2);
      const Hinic = Ho;

      // Reverse cumulative Hf
      rows[0].hfAte = fmt(SHft, 4);
      for (let i = 1; i < Ne; i++) {
        rows[i].hfAte = fmt(rows[i - 1].hfAte - rows[i - 1].hfTrecho, 4);
      }

      // Pressure at each emitter
      for (let i = 0; i < Ne; i++) {
        rows[i].hEmissor = fmt(Hinic - rows[i].hfAte, 4);
      }

      const Hult = rows[0].hEmissor;  // Last emitter (end of pipe)
      const Hpri = rows[Ne - 1].hEmissor;  // First emitter (near start)
      const varPressao = fmt(((Hpri - Hult) / Hpri) * 100, 2);
      const varVazao = fmt((1 - (1 - varPressao / 100) ** epx) * 100, 2);

      // Average pressure/flow location
      const Lpm = LT * 0.37;
      const lqm = Math.floor(Lpm / Easp);
      const lqp = lqm + 1;
      const dista = fmt(Lpm - ((lqm - 1) * Easp + distpri), 2);
      const locMsg1 = `Pressão e Vazão média a: ${fmtBR(Lpm, 2)} m do início da lateral.`;
      const locMsg2 = `Entre os emissores: ${lqm} e ${lqp} e a ${fmtBR(dista, 2)} m do emissor ${lqm}`;

      setResult({ rows, Ho, HfTotal: Hftt, varPressao, varVazao, locMsg1, locMsg2 });
    } catch {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  const TH = "px-2 py-1.5 text-right text-xs font-semibold whitespace-nowrap";
  const TD = "px-2 py-1 text-right text-xs whitespace-nowrap";

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Diâmetro do bocal 1 (mm)" value={Db1} onChange={setDb1} />
        <NumInput label="Diâmetro do bocal 2 (mm)" value={Db2} onChange={setDb2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Coeficiente de descarga do bocal 1" value={Cd1} onChange={setCd1} />
        <NumInput label="Coeficiente de descarga do bocal 2" value={Cd2} onChange={setCd2} />
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>}

      <button onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
        <Droplets size={18} /> CALCULAR
      </button>

      {result && (
        <div className="space-y-4">
          <div className="overflow-x-auto overflow-y-auto rounded-lg border border-border max-h-64">
            <table className="min-w-[1400px] font-body">
              <thead className="sticky top-0"><tr className="bg-muted">
                <th className={TH}>Emissor</th><th className={TH}>Trecho</th><th className={TH}>Comp./Trecho (m)</th>
                <th className={TH}>Diâm. (mm)</th><th className={TH}>Dist. (m)</th><th className={TH}>Hf (m)</th>
                <th className={TH}>H(emissor) (m)</th><th className={TH}>Vazão (m³/h)</th><th className={TH}>Vazão/Trecho (m³/h)</th>
                <th className={TH}>Vel./Trecho (m/s)</th><th className={TH}>NR/Trecho</th><th className={TH}>f/Trecho</th>
                <th className={TH}>Hf/Trecho (m)</th><th className={TH}>Hf até emissor (m)</th><th className={TH}>H no emissor (m)</th>
              </tr></thead>
              <tbody>{result.rows.map(r => (
                <tr key={r.emissor} className="border-b border-border">
                  <td className={TD}>{r.emissor}</td><td className={TD}>{r.trecho}</td><td className={TD}>{r.comp}</td>
                  <td className={TD}>{fmtBR(r.diam, 1)}</td><td className={TD}>{r.dist}</td><td className={TD}>{fmtBR(r.hfl, 5)}</td>
                  <td className={TD}>{fmtBR(r.hem, 3)}</td><td className={TD}>{fmtBR(r.qe, 2)}</td><td className={TD}>{fmtBR(r.qtch, 2)}</td>
                  <td className={TD}>{fmtBR(r.vel, 2)}</td><td className={TD}>{r.reynolds}</td><td className={TD}>{fmtBR(r.f, 4)}</td>
                  <td className={TD}>{fmtBR(r.hfTrecho, 4)}</td><td className={TD}>{fmtBR(r.hfAte, 4)}</td><td className={TD}>{fmtBR(r.hEmissor, 4)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="equation-block px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Ho (m)</p>
              <p className="font-display text-lg font-bold text-primary">{fmtBR(result.Ho, 2)}</p>
            </div>
            <div className="equation-block px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-1">HfTotal (m)</p>
              <p className="font-display text-lg font-bold text-primary">{fmtBR(result.HfTotal, 2)}</p>
            </div>
            <div className="equation-block px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Var. da Pressão (%)</p>
              <p className="font-display text-lg font-bold text-primary">{fmtBR(result.varPressao, 2)}</p>
            </div>
            <div className="equation-block px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Var. da Vazão (%)</p>
              <p className="font-display text-lg font-bold text-primary">{fmtBR(result.varVazao, 2)}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm font-body text-primary">
            <p>{result.locMsg1}</p>
            <p>{result.locMsg2}</p>
          </div>
        </div>
      )}
    </div>
  );
}
