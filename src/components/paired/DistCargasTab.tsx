import { DadosResult, fmt, fmtBR } from "./utils";
import { EmparResult } from "./EmparelhamentoTab";

interface Props { dadosResult: DadosResult | null; emparResult: EmparResult | null; }

export default function DistCargasTab({ dadosResult, emparResult }: Props) {
  if (!dadosResult || !emparResult) {
    return (
      <div className="p-5">
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
          ⚠ Calcule os dados na aba 'Dados' e 'Emparelhamento' primeiro.
        </div>
      </div>
    );
  }

  const { m } = dadosResult;
  const { hfDec, i_pos, compDec, locPmin, frameLabel } = emparResult;
  const mPlus1 = m + 1;

  // TextBox49: Decréscimo da carga entre o início e o ponto de mínima
  const HoToHmi = fmt(hfDec * (1 - (1 - i_pos) ** mPlus1), 2);

  // TextBox55: Decréscimo da carga entre o ponto de mínima e final
  const Ldec = compDec;
  const Lmef = Ldec - locPmin;
  const HmiToHfi = fmt(hfDec * (Lmef / Ldec) ** mPlus1, 2);

  return (
    <div className="p-5 space-y-4">
      <h4 className="font-display font-semibold text-foreground text-sm">{frameLabel}</h4>

      <div className="space-y-4">
        <div className="equation-block px-4 py-3">
          <p className="text-right text-xs text-muted-foreground font-body mb-1">Ho a Hmi</p>
          <p className="text-xs text-foreground font-body">
            Decréscimo da carga entre o início e o ponto de mínima da lateral
          </p>
          <p className="font-display text-lg font-bold text-primary text-right">{fmtBR(HoToHmi, 2)}</p>
        </div>

        <div className="equation-block px-4 py-3">
          <p className="text-right text-xs text-muted-foreground font-body mb-1">Hmi a Hfi</p>
          <p className="text-xs text-foreground font-body">
            Decréscimo da carga entre o ponto de mínima e final da lateral
          </p>
          <p className="font-display text-lg font-bold text-primary text-right">{fmtBR(HmiToHfi, 2)}</p>
        </div>
      </div>
    </div>
  );
}
