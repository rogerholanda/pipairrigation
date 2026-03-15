import { DadosResult, fmt, fmtBR, ResultField } from "./utils";

interface Props { dadosResult: DadosResult | null; }

export default function DistCargasTab({ dadosResult }: Props) {
  if (!dadosResult) {
    return (
      <div className="p-5">
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
          ⚠ Calcule os dados na aba 'Dados' e 'Emparelhamento' primeiro.
        </div>
      </div>
    );
  }

  const { Hflcor, m, dz } = dadosResult;
  const raz = dz !== 0 && Hflcor !== 0 ? fmt(dz / Hflcor, 2) : 0;

  // Posição relativa de ocorrência da pressão mínima
  const mPlus1 = m + 1;
  const i_pos = raz > 0 ? fmt(1 - (raz / mPlus1) ** (1 / m), 3) : 0.38;

  // Decréscimo da carga entre o início e o ponto de mínima (Ho a Hmi)
  const HoToHmi = fmt(Hflcor * (1 - (1 - i_pos) ** mPlus1), 2);

  // Decréscimo da carga entre o ponto de mínima e final (Hmi a Hfi)
  const Lmef = 1 - i_pos; // relative
  const HmiToHfi = fmt(Hflcor * Lmef ** mPlus1, 2);

  const frameLabel = raz === 0 ? "Tubulação em nível" : "Tubulação em declive";

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
