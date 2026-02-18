import { useState, useEffect } from "react";
import { X, Calculator, Droplets } from "lucide-react";

interface CalcResults {
  velocity: string;
  reynolds: string;
  rugosidade: string;
  frictionFactor: string;
  headLoss: string;
  regime: string;
  frictionMethod: string;
  tubeType: string;
  viscosity: string;
  density: string;
}

interface IrrigationCalculatorProps {
  open: boolean;
  onClose: () => void;
}

const PIPE_DIAMETERS = [5.3, 13, 13.6, 16, 20.6, 26.9, 35.7, 48.1, 72.5, 97.6];
const PIPE_MATERIALS = [
  { label: "PEBD", name: "Polietileno de Baixa Densidade", roughness: 0.0015 },
  { label: "PVC", name: "Penta Cloreto de Vinila", roughness: 0.003334 },
  { label: "AZDº", name: "Aço Zincado com Costura", roughness: 0.15 },
];

export default function IrrigationCalculator({ open, onClose }: IrrigationCalculatorProps) {
  const [flowUnit, setFlowUnit] = useState<"m3h" | "Lh">("m3h");
  const [flow, setFlow] = useState("");
  const [length, setLength] = useState("");
  const [temp, setTemp] = useState("25");
  const [diameter, setDiameter] = useState("26.9");
  const [materialIdx, setMaterialIdx] = useState(0);
  const [results, setResults] = useState<CalcResults | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const calcViscosity = (Tempa: number) => {
    const Kelv = Tempa + 273.16;
    const Lgu = -11.73 + 1828 / Kelv + 0.01966 * Kelv - 0.00001466 * Kelv ** 2;
    return (10 ** Lgu) / 100; // m²/s
  };

  const calcDensity = (Tempa: number) => {
    const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
    return 1000 * (1 - Fct);
  };

  const calculate = () => {
    setError("");
    try {
      const Q = parseFloat(flow);
      const L = parseFloat(length);
      const Di = parseFloat(diameter);
      const Tempa = parseFloat(temp);
      const material = PIPE_MATERIALS[materialIdx];
      const e = material.roughness;

      if (isNaN(Q) || isNaN(L) || isNaN(Di) || isNaN(Tempa)) {
        setError("Verifique se todos os dados estão preenchidos corretamente.");
        return;
      }

      const u = calcViscosity(Tempa);        // m²/s (kinematic)
      const Uc = u * 1000;                    // x10⁻³ N.s/m²
      const mespa = calcDensity(Tempa);       // kg/m³

      // Velocity
      let V: number;
      if (flowUnit === "m3h") {
        V = 353.67765 * Q / Di ** 2;
      } else {
        V = Q / (2.8274 * Di ** 2);
      }

      // Reynolds
      const Re = mespa * V * Di / (Uc); // using dynamic visc in 10^-3 N.s/m² = mPa.s

      // Rugosidade hidráulica adimensional
      const RgHid = (Re ** 0.9) * e / Di;

      // Friction factor & head loss
      let f: number;
      let hf: number;
      let frictionMethod: string;
      let regime: string;
      let tubeType = "";

      if (Re < 2000) {
        // Laminar — Hagen-Poiseuille
        f = 64 / Re;
        frictionMethod = "Hagen-Poiseuille";
        regime = "Fluxo Laminar";
        if (flowUnit === "m3h") {
          hf = 11.536e5 * u / mespa * Q * L / Di ** 4;
        } else {
          hf = 11.536e5 * u / mespa * (Q / 1000) * L / Di ** 4;
        }
      } else {
        // Turbulent — Colebrook-White iterative
        let oldf = 0.02;
        for (let i = 0; i < 200; i++) {
          const newf = 1 / (-2 * Math.log10(e / (3.7 * Di) + 2.51 / (Re * Math.sqrt(oldf)))) ** 2;
          if (Math.abs((newf - oldf) / oldf) < 0.001) { oldf = newf; break; }
          oldf = newf;
        }
        f = oldf;
        frictionMethod = "Colebrook-White";

        if (Re >= 2000 && Re <= 4000) {
          regime = "Região de Transição";
        } else {
          regime = "Regime Turbulento";
          if (RgHid <= 31) tubeType = "Tubo Hidraulicamente Liso";
          else if (RgHid >= 448) tubeType = "Tubo Hidraulicamente Rugoso";
          else tubeType = "Tubo Hidraulicamente Misto";
        }

        if (flowUnit === "m3h") {
          hf = 6.376e6 * f * Q ** 2 * L / Di ** 5;
        } else {
          hf = 6.376 * f * Q ** 2 * L / Di ** 5;
        }
      }

      setResults({
        velocity: V.toFixed(2),
        reynolds: Re.toFixed(2),
        rugosidade: RgHid.toFixed(2),
        frictionFactor: f.toFixed(4),
        headLoss: hf.toFixed(3),
        regime,
        frictionMethod,
        tubeType,
        viscosity: Uc.toFixed(2),
        density: mespa.toFixed(2),
      });
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  if (!open) return null;

  const material = PIPE_MATERIALS[materialIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "hsl(152 30% 10% / 0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-elegant"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        {/* Header */}
        <div className="gradient-primary px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="text-primary-foreground" size={24} />
            <div>
              <h2 className="font-display text-lg font-semibold text-primary-foreground leading-tight">
                Calculadora Hidráulica
              </h2>
              <p className="text-primary-foreground/80 text-xs font-body">
                Perda de Carga — Darcy-Weisbach &amp; Colebrook-White
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors rounded-full p-1"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Flow unit */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
              Unidade de Vazão
            </label>
            <div className="flex gap-3">
              {[{ val: "m3h" as const, label: "m³/h" }, { val: "Lh" as const, label: "L/h" }].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setFlowUnit(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-all border ${
                    flowUnit === opt.val
                      ? "gradient-primary text-primary-foreground border-transparent shadow-md"
                      : "bg-muted text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <InputField label={`Vazão (${flowUnit === "m3h" ? "m³/h" : "L/h"})`} value={flow} onChange={setFlow} placeholder="Ex: 2.5" />
            <InputField label="Comprimento (m)" value={length} onChange={setLength} placeholder="Ex: 100" />
          </div>

          {/* Inputs row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
                Temperatura (°C)
              </label>
              <input
                type="number"
                value={temp}
                onChange={e => setTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ borderColor: "hsl(var(--border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
                Diâmetro Interno (mm)
              </label>
              <select
                value={diameter}
                onChange={e => setDiameter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {PIPE_DIAMETERS.map(d => <option key={d} value={d}>{d} mm</option>)}
              </select>
            </div>
          </div>

          {/* Material */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
              Material da Tubulação
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PIPE_MATERIALS.map((m, i) => (
                <button
                  key={m.label}
                  onClick={() => setMaterialIdx(i)}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all border ${
                    materialIdx === i
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-muted text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-body">
              {material.name} — Rugosidade: ε = {material.roughness} mm
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
              ⚠ {error}
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={calculate}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
          >
            <Droplets size={18} />
            Calcular Perda de Carga
          </button>

          {/* Results */}
          {results && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-semibold text-foreground text-base">Resultados</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Velocidade" value={`${results.velocity} m/s`} />
                <ResultCard label="Número de Reynolds" value={results.reynolds} />
                <ResultCard label="Rugosidade Hidráulica" value={results.rugosidade} />
                <ResultCard label="Fator de Atrito (f)" value={results.frictionFactor} highlight />
              </div>
              <div
                className="equation-block px-5 py-4"
              >
                <p className="text-xs text-muted-foreground font-body mb-1">Perda de Carga (hf)</p>
                <p className="font-display text-2xl font-bold text-primary">{results.headLoss} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag label={results.regime} color="primary" />
                {results.tubeType && <Tag label={results.tubeType} color="secondary" />}
                <Tag label={results.frictionMethod} color="accent" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-body text-muted-foreground">
                <span>Viscosidade dinâmica: {results.viscosity} × 10⁻³ N.s/m²</span>
                <span>Massa específica: {results.density} kg/m³</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "equation-block" : "bg-muted"}`}>
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className={`font-semibold font-body mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: "primary" | "secondary" | "accent" }) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  }[color];
  return (
    <span className={`text-xs font-semibold font-body px-3 py-1 rounded-full ${cls}`}>{label}</span>
  );
}
