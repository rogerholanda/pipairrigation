import { useState } from "react";
import { Droplets, Printer } from "lucide-react";
import { printReport, br } from "@/lib/printReport";
import {
  PairedInputs, DadosResult, PAIRED_MATERIALS, PAIRED_PIPE_SIZES, PAIRED_CONEXOES,
  fmt, fmtBR, colebrook, calcFluidProps, NumInput, ResultField,
} from "./utils";

interface Props {
  inputs: PairedInputs;
  setInputs: (fn: (prev: PairedInputs) => PairedInputs) => void;
  onResult: (r: DadosResult) => void;
}

export default function DadosTab({ inputs, setInputs, onResult }: Props) {
  const [result, setResult] = useState<DadosResult | null>(null);
  const [error, setError] = useState("");

  const set = (key: keyof PairedInputs) => (v: string) =>
    setInputs(prev => ({ ...prev, [key]: v }));

  const calculate = () => {
    setError("");
    try {
      const exp = parseFloat(inputs.exp);
      const Temp = parseFloat(inputs.Temp);
      const conex = parseFloat(inputs.conex);
      const Di = parseFloat(inputs.Di);
      const Ltotal = parseFloat(inputs.Ltotal);
      const Eem = parseFloat(inputs.Eem);
      const Dist1 = parseFloat(inputs.Dist1);
      const desn = parseFloat(inputs.desn);
      const qem = parseFloat(inputs.qem);
      const hast = parseFloat(inputs.hast);
      const vq = parseFloat(inputs.vq);
      const Rug = parseFloat(inputs.Rug);
      const Pn = parseFloat(inputs.Pn);

      // Número de emissores
      const Nem = fmt(((Ltotal - 1) / Eem) + 1, 0);

      // Vazão total
      const Qt = fmt(Nem * qem, 2);

      // Velocidade
      let Vel: number;
      if (inputs.flowUnit === "m3h") {
        Vel = fmt(353.67765 * Qt / Di ** 2, 2);
      } else {
        Vel = fmt(Qt / (2.8274 * Di ** 2), 2);
      }

      // Propriedades do fluido
      const { uc, mespa, visc } = calcFluidProps(Temp);

      // Reynolds
      const Re = fmt(mespa * Vel * Di / uc, 0);

      // Comprimento equivalente (conexão do emissor)
      const fe = 0.25 * conex * 19 * Di ** -1.9;
      const Le = Ltotal * ((Eem + fe) / Eem);

      // Fator de atrito
      let f: number;
      if (Re < 2000) {
        f = fmt(64 / Re, 4);
      } else {
        f = fmt(colebrook(Rug, Di, Re), 4);
      }

      // Determinação do expoente m e cálculo de Hfl
      let Hfl: number;
      let m: number;

      if (Re > 100000) {
        // Regime totalmente turbulento
        m = 2;
        if (inputs.flowUnit === "m3h") {
          Hfl = fmt(6.376e6 * f * Qt ** 2 * Le / Di ** 5, 2);
        } else {
          Hfl = fmt(6.376 * f * Qt ** 2 * Le / Di ** 5, 2);
        }
      } else if (Re > 2000) {
        // Regime turbulento liso
        m = 1.75;
        if (inputs.flowUnit === "m3h") {
          Hfl = fmt(2.6125e6 * visc ** 0.25 * Qt ** 1.75 * Le / Di ** 4.75, 2);
        } else {
          Hfl = fmt(14.69 * visc ** 0.25 * Qt ** 1.75 * Le / Di ** 4.75, 2);
        }
      } else {
        // Laminar
        m = 1;
        Hfl = fmt(6.376e6 * f * Qt ** 2 * Le / Di ** 5, 2);
      }

      // Fator F de Christiansen
      const Fch = fmt(1 / (m + 1) + 1 / (2 * Nem) + 1 / (6 * Nem ** 2), 3);

      // Fator Fa de Scaloppi
      const Razao = 1;
      const Fa = fmt((Fch * Nem + Razao - 1) / (Nem + Razao - 1), 3);

      // Hfl corrigido
      const Hflcor = fmt(Hfl * Fa, 2);

      // Variação de pressão máxima admissível
      const Vpadm = fmt((1 - (1 - vq / 100) ** (1 / exp)) * 100, 0);

      // Perda de carga máxima admissível
      const Hfladm = fmt((Vpadm / 100) * (Pn + hast) / (1 - ((m + 1) / (m + 2)) * (Vpadm / 100)), 2);

      // Desnível
      const dz = fmt(desn * Ltotal / 100, 4);

      const res: DadosResult = {
        Nem, Qt, Vel, Re, f, Hfl, Fa, Hflcor, m, dz, Vpadm, Hfladm,
      };
      setResult(res);
      onResult(res);
    } catch {
      setError("Erro no cálculo. Verifique os dados.");
    }
  };

  const mat = PAIRED_MATERIALS[inputs.materialIdx];

  return (
    <div className="p-5 space-y-4">
      {/* Dados */}
      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Comprimento total da tubulação (m)" value={inputs.Ltotal} onChange={set("Ltotal")} />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Diâmetro do tubo (mm)
          </label>
          <select
            value={inputs.Di}
            onChange={e => set("Di")(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {PAIRED_PIPE_SIZES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Material do tubo
          </label>
          <div className="flex gap-2">
            {PAIRED_MATERIALS.map((m, i) => (
              <button
                key={m.label}
                onClick={() => {
                  setInputs(prev => ({ ...prev, materialIdx: i, Rug: m.roughness.toString() }));
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                  inputs.materialIdx === i
                    ? "gradient-primary text-primary-foreground border-transparent"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <NumInput label="Desnível Topográfico (%)" value={inputs.desn} onChange={set("desn")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Rugosidade absoluta (mm)" value={inputs.Rug} onChange={set("Rug")} />
        <NumInput label="Distância do 1º emissor (m)" value={inputs.Dist1} onChange={set("Dist1")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Espaçamento entre emissores (m)" value={inputs.Eem} onChange={set("Eem")} />
        <NumInput label="Altura da haste (m)" value={inputs.hast} onChange={set("hast")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Expoente x da equação (Q x H)" value={inputs.exp} onChange={set("exp")} />
        <NumInput label="Variação da Vazão (%)" value={inputs.vq} onChange={set("vq")} />
      </div>

      {/* Unidade de vazão */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Vazão do emissor
          </label>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1 text-xs font-body text-foreground">
              <input
                type="radio"
                checked={inputs.flowUnit === "m3h"}
                onChange={() => setInputs(prev => ({ ...prev, flowUnit: "m3h" }))}
                className="accent-primary"
              /> m³/h
            </label>
            <label className="flex items-center gap-1 text-xs font-body text-foreground">
              <input
                type="radio"
                checked={inputs.flowUnit === "Lh"}
                onChange={() => setInputs(prev => ({ ...prev, flowUnit: "Lh" }))}
                className="accent-primary"
              /> L/h
            </label>
            <input
              type="number"
              value={inputs.qem}
              onChange={e => set("qem")(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          </div>
        </div>
        <NumInput label="Temp. da água (°C)" value={inputs.Temp} onChange={set("Temp")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput label="Pressão de serviço do emissor (m)" value={inputs.Pn} onChange={set("Pn")} />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Conexão do emissor
          </label>
          <select
            value={inputs.conex}
            onChange={e => set("conex")(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {PAIRED_CONEXOES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {error}</div>}

      <div className="flex gap-2">
        <button onClick={calculate}
          className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
          <Droplets size={18} /> Calcular
        </button>
        <button
          onClick={() => {
            if (!result) { alert("Calcule primeiro para gerar o relatório."); return; }
            printReport({
              calculator: "Laterais Emparelhadas",
              subtitle: "Dimensionamento de laterais emparelhadas",
              sections: [
                {
                  title: "1. Dados de Entrada",
                  rows: [
                    { label: "Expoente (x)", value: br(inputs.exp) },
                    { label: "Temperatura", value: br(inputs.Temp, "°C") },
                    { label: "Conexão", value: br(inputs.conex, "mm") },
                    { label: "Diâmetro interno (Di)", value: br(inputs.Di, "mm") },
                    { label: "Comprimento total (Ltotal)", value: br(inputs.Ltotal, "m") },
                    { label: "Espaçam. emissores (Eem)", value: br(inputs.Eem, "m") },
                    { label: "Distância da 1ª planta (Dist1)", value: br(inputs.Dist1, "m") },
                    { label: "Desnível", value: br(inputs.desn, "m") },
                    { label: "Vazão emissor (qem)", value: br(inputs.qem, "L/h") },
                    { label: "Altura tubo (hast)", value: br(inputs.hast, "m") },
                    { label: "Variação de vazão (Vq)", value: br(inputs.vq, "%") },
                    { label: "Material", value: PAIRED_MATERIALS[inputs.materialIdx].label },
                    { label: "Rugosidade (ε)", value: br(inputs.Rug, "mm") },
                    { label: "Pressão nominal (Pn)", value: br(inputs.Pn, "m.c.a.") },
                    { label: "Unidade de vazão", value: inputs.flowUnit === "m3h" ? "m³/h" : "L/h" },
                  ],
                },
                {
                  title: "2. Resultados — Lateral",
                  highlightLast: true,
                  rows: [
                    { label: "Número total de emissores (Nem)", value: br(result.Nem.toFixed(0)) },
                    { label: "Vazão total (Qt)", value: br(result.Qt.toFixed(2)) },
                    { label: "Velocidade (V)", value: br(result.Vel.toFixed(2), "m/s") },
                    { label: "Número de Reynolds (Re)", value: br(String(result.Re)) },
                    { label: "Expoente m", value: br(result.m.toFixed(0)) },
                    { label: "Fator de atrito (f)", value: br(result.f.toFixed(4)) },
                    { label: "Fa de Scaloppi", value: br(result.Fa.toFixed(3)) },
                    { label: "HfL contínuo", value: br(result.Hfl.toFixed(2), "m") },
                    { label: "HfL corrigido", value: br(result.Hflcor.toFixed(2), "m") },
                    { label: "Desnível (Δz)", value: br(result.dz.toFixed(2), "m") },
                    { label: "Variação de pressão admissível", value: br(result.Vpadm.toFixed(2), "m.c.a.") },
                    { label: "Decréscimo de carga máximo (Hfladm)", value: br(result.Hfladm.toFixed(2), "m") },
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
        <div className="space-y-3">
          <h4 className="font-display font-semibold text-foreground text-sm">Cálculos</h4>
          <div className="grid grid-cols-2 gap-3">
            <ResultField label="Número total de emissores" value={fmtBR(result.Nem, 0)} />
            <ResultField label="HfL contínuo (m)" value={fmtBR(result.Hfl, 2)} />
            <ResultField label="Vazão total" value={fmtBR(result.Qt, 2)} />
            <ResultField label="Fa de Scaloppi" value={fmtBR(result.Fa, 3)} />
            <ResultField label="Velocidade da água (m/s)" value={fmtBR(result.Vel, 2)} />
            <ResultField label="HfL corrigido (m)" value={fmtBR(result.Hflcor, 2)} />
            <ResultField label="Número de Reynolds" value={result.Re.toString()} />
            <ResultField label="Expoente m" value={fmtBR(result.m, 0)} />
            <ResultField label="f de Colebrook" value={fmtBR(result.f, 4)} />
            <ResultField label="Decréscimo de carga máximo (m)" value={fmtBR(result.Hfladm, 2)} />
          </div>
        </div>
      )}
    </div>
  );
}
