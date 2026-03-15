import { useState } from "react";
import { Droplets } from "lucide-react";
import { PairedInputs, DadosResult, fmt, fmtBR, ResultField } from "./utils";

export interface EmparResult {
  dz: number; raz: number;
  compRelAcl: number; compRelDec: number;
  compAcl: number; compDec: number;
  neAcl: number; neDec: number;
  qAcl: number; qDec: number;
  hfAcl: number; hfDec: number;
  dzAcl: number; dzDec: number;
  HmaxAcl: number; HmaxDec: number;
  HminAcl: number; HminDec: number;
  varPrAcl: number; varPrDec: number;
  varQAcl: number; varQDec: number;
  locPmin: number;
  dzHfDec: number;
  i_pos: number;
  labelAcl: string; labelDec: string;
  labelLocPmin: string; labelPminNote: string;
  frameLabel: string;
}

interface Props { inputs: PairedInputs; dadosResult: DadosResult | null; onResult?: (r: EmparResult) => void; }

export default function EmparelhamentoTab({ inputs, dadosResult, onResult }: Props) {
  const [varMaxPressao, setVarMaxPressao] = useState("19");
  const [result, setResult] = useState<EmparResult | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    if (!dadosResult) { setError("Calcule os dados na aba 'Dados' primeiro."); return; }
    try {
      const Ltotal = parseFloat(inputs.Ltotal);
      const Eem = parseFloat(inputs.Eem);
      const Dist1 = parseFloat(inputs.Dist1);
      const Pn = parseFloat(inputs.Pn);
      const hast = parseFloat(inputs.hast);
      const exp = parseFloat(inputs.exp);

      const { Hflcor, m, dz } = dadosResult;
      const raz = fmt(dz / Hflcor, 2);

      // Iterative solve for y (relative uphill length)
      let y: number;
      const mPlus1 = m + 1;

      if (raz === 0) {
        y = 0.5;
      } else {
        let zp: number;
        if (m === 2) {
          zp = raz * (1 - 0.3849 * raz ** 0.5);
        } else {
          zp = raz * (1 - 0.3575 * raz ** 0.5714);
        }

        if (zp === 0) {
          y = 0.5;
        } else {
          let oldy = 1;
          for (let iter = 0; iter < 500; iter++) {
            const cub = Math.abs(oldy ** (m + 1));
            const soma = Math.abs(zp + cub);
            const exponent = m === 2 ? 1 / 3 : 0.3636;
            const raiz = 1 - Math.abs(soma ** exponent);
            const newy = Math.abs(raiz);
            if (Math.abs((newy - oldy) / oldy) < 0.001) { oldy = newy; break; }
            oldy = newy;
          }
          y = oldy;
        }
      }

      const compRelAcl = fmt(y, 3);
      const compRelDec = fmt(1 - y, 3);

      // Comprimentos corrigidos por emissores
      let compDec = fmt(compRelDec * Ltotal, 0);
      let neDec = fmt(compDec / Eem, 0);
      compDec = fmt((neDec - 1) * Eem + Dist1, 0);
      let compAcl = fmt(Ltotal - compDec, 0);
      let neAcl = fmt(compAcl / Eem, 0);

      const qem = parseFloat(inputs.qem);
      const qAcl = fmt(neAcl * qem, 2);
      const qDec = fmt(neDec * qem, 2);

      // Hf por trecho
      const hfAcl = fmt(Hflcor * (compAcl / Ltotal) ** mPlus1, 2);
      const hfDec = fmt(Hflcor * (compDec / Ltotal) ** mPlus1, 2);

      // Desnível por trecho
      const dzAcl = fmt(dz * (compAcl / Ltotal), 2);
      const dzDec = fmt(dz * (compDec / Ltotal), 2);

      // dz/Hf em declive
      const dzHfDec = hfDec !== 0 ? fmt(dzDec / hfDec, 2) : 0;
      const Raz12 = dzHfDec;

      // Fração em função do regime de fluxo
      const fr = fmt((m + 1) / (m + 2), 2);
      const frInv = fmt(1 / (m + 2), 2);

      // Pressões - trecho em aclive
      let HmaxAcl: number, HminAcl: number, varPrAcl: number, varQAcl: number;

      if (raz >= 0 && raz <= 1) {
        HmaxAcl = fmt(Pn + fr * hfAcl + 0.5 * dzAcl + hast, 2);
        HminAcl = fmt(Pn - frInv * hfAcl - 0.5 * dzAcl + hast, 2);
        varPrAcl = fmt(((HmaxAcl - HminAcl) / HmaxAcl) * 100, 2);
        varQAcl = fmt((1 - (1 - varPrAcl / 100) ** exp) * 100, 2);
      } else {
        // raz > 1
        if (compRelDec >= 1) {
          HmaxAcl = 0; HminAcl = 0; varPrAcl = 0; varQAcl = 0;
        } else {
          HmaxAcl = fmt(Pn + frInv * hfAcl + 0.5 * dzAcl + hast, 2);
          HminAcl = fmt(Pn - frInv * hfAcl - 0.5 * dzAcl + hast, 2);
          varPrAcl = fmt(((HmaxAcl - HminAcl) / HmaxAcl) * 100, 2);
          varQAcl = fmt((1 - (1 - varPrAcl / 100) ** exp) * 100, 2);
        }
      }

      // Posição relativa de ocorrência da pressão mínima no trecho em declive
      const i_pos = Raz12 > 0 ? fmt(1 - (Raz12 / mPlus1) ** (1 / m), 3) : 0;

      // Pressões - trecho em declive
      let HmaxDec: number, HminDec: number, varPrDec: number, varQDec: number;

      if (raz >= 0 && raz <= 1) {
        HmaxDec = fmt(Pn + fr * hfDec - 0.5 * dzDec + hast, 2);
        HminDec = fmt(Pn + hast + ((1 - i_pos) ** mPlus1 - frInv) * hfDec + (i_pos - 0.5) * dzDec, 2);
        const Dhabs = fmt((1 - (1 - i_pos) ** mPlus1) * hfDec - i_pos * dzDec, 1);
        varPrDec = fmt((Dhabs / HmaxDec) * 100, 2);
        varQDec = fmt((1 - (1 - varPrDec / 100) ** exp) * 100, 2);
      } else {
        // raz > 1
        HmaxDec = fmt(Pn - frInv * hfDec + 0.5 * dzDec + hast, 2);
        const Hinc = fmt(Pn + fr * hfDec - 0.5 * dzDec, 2);
        HminDec = fmt(Pn + hast + ((1 - i_pos) ** mPlus1 - frInv) * hfDec + (i_pos - 0.5) * dzDec, 2);
        const Dhabs = fmt((1 - (1 - i_pos) ** mPlus1) * hfDec - i_pos * dzDec, 2);
        varPrDec = fmt((Dhabs / Hinc) * 100, 2);
        varQDec = fmt((1 - (1 - varPrDec / 100) ** exp) * 100, 2);
      }

      // Local de ocorrência da pressão mínima
      let locPmin = fmt(i_pos * compDec, 2);

      // Labels
      let labelAcl = "Aclive";
      let labelDec = "Declive";
      let labelLocPmin = "do Início da lateral em declive";
      let labelPminNote = "Ponto intermediário";
      let frameLabel = "Tubulação em declive";

      if (raz === 0) {
        locPmin = fmt(0.38 * compDec, 2);
        labelAcl = "Nível"; labelDec = "Nível";
        labelLocPmin = "do Início da lateral em declive";
        labelPminNote = "No final da lateral";
        frameLabel = "Tubulação em nível";
      } else if (Raz12 > 0 && Raz12 < 1) {
        labelLocPmin = "do Início da lateral em declive";
        labelPminNote = "Ponto intermediário";
      } else if (Raz12 >= 1 && Raz12 < (m + 1 + m / (m + 2))) {
        labelLocPmin = "do Início da lateral em declive";
        labelPminNote = "Ponto intermediário";
      } else if (Raz12 >= (m + 1 + m / (m + 2))) {
        labelLocPmin = "do Início da lateral em declive";
        labelPminNote = "No início da lateral";
      }

      const res: EmparResult = {
        dz, raz, compRelAcl, compRelDec, compAcl, compDec,
        neAcl, neDec, qAcl, qDec, hfAcl, hfDec,
        dzAcl, dzDec, HmaxAcl, HmaxDec, HminAcl, HminDec,
        varPrAcl, varPrDec, varQAcl, varQDec,
        locPmin, dzHfDec, i_pos,
        labelAcl, labelDec, labelLocPmin, labelPminNote, frameLabel,
      };
      setResult(res);
      onResult?.(res);
    } catch {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <ResultField label="Desnível Topográfico (m)" value={dadosResult ? fmtBR(dadosResult.dz, 4) : "—"} />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Variação máxima da pressão (%)
          </label>
          <input
            type="number" value={varMaxPressao} onChange={e => setVarMaxPressao(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>}

      <button onClick={calculate}
        className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
        <Droplets size={18} /> Calcular
      </button>

      {result && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="equation-block px-4 py-2">
              <span className="text-xs text-muted-foreground font-body mr-2">dz/Hf comprimento total</span>
              <span className="font-display font-bold text-primary">{fmtBR(result.raz, 2)}</span>
            </div>
          </div>

          {/* Tabela comparativa Aclive x Declive */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"></th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">{result.labelAcl}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">{result.labelDec}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Comprimento relativo dos trechos (%)", fmtBR(result.compRelAcl, 3), fmtBR(result.compRelDec, 3)],
                  ["Comprimento de cada trecho (m)", fmtBR(result.compAcl, 0), fmtBR(result.compDec, 0)],
                  ["Número de emissores/Trecho", fmtBR(result.neAcl, 0), fmtBR(result.neDec, 0)],
                  ["Vazão/Trecho", fmtBR(result.qAcl, 2), fmtBR(result.qDec, 2)],
                  ["Decréscimo da carga de pressão/Trecho (m)", fmtBR(result.hfAcl, 2), fmtBR(result.hfDec, 2)],
                  ["Desnível topográfico/Trecho (m)", fmtBR(result.dzAcl, 2), fmtBR(result.dzDec, 2)],
                  ["Carga de Pressão máxima (m)", fmtBR(result.HmaxAcl, 2), fmtBR(result.HmaxDec, 2)],
                  ["Carga de Pressão mínima (m)", fmtBR(result.HminAcl, 2), fmtBR(result.HminDec, 2)],
                  ["Variação da Carga de Pressão (%)", fmtBR(result.varPrAcl, 2), fmtBR(result.varPrDec, 2)],
                  ["Variação da vazão (%)", fmtBR(result.varQAcl, 2), fmtBR(result.varQDec, 2)],
                ].map(([label, acl, dec], idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="px-3 py-1.5 text-xs text-foreground">{label}</td>
                    <td className="px-3 py-1.5 text-right text-xs text-foreground">{acl}</td>
                    <td className="px-3 py-1.5 text-right text-xs text-foreground">{dec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 items-center">
            <ResultField label="dz/Hf em declive" value={fmtBR(result.dzHfDec, 2)} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="equation-block px-4 py-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Local de ocorrência da pressão média/mínima (m)</p>
              <p className="font-display text-lg font-bold text-primary">{fmtBR(result.locPmin, 2)}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{result.labelLocPmin}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
