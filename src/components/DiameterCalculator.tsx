import { useState } from "react";
import { Ruler, Droplets } from "lucide-react";

interface DiamResults {
  diameter: string;
  velocity: string;
  reynolds: string;
  frictionFactor: string;
  headLoss: string;
  viscosity: string;
  density: string;
}

const DIAM_MATERIALS = [
  { label: "PVC", roughness: 0.003334 },
  { label: "AZDº", roughness: 0.15 },
];


// Ke options (entrada)
const KE_OPTIONS = ["0.5"];
// Ks options (saída)
const KS_OPTIONS = ["1"];
// KRg options (registros de gaveta)
const KRG_OPTIONS = ["0.4", "0.2"];
// Kc options (curvas 90°)
const KC_OPTIONS = ["0.2", "10"];

export default function DiameterCalculator() {
  const [flow, setFlow] = useState("");
  const [length, setLength] = useState("");
  const [headLossAllowed, setHeadLossAllowed] = useState("");
  const [temp, setTemp] = useState("25");
  const [materialIdx, setMaterialIdx] = useState(0);
  const [roughness, setRoughness] = useState(DIAM_MATERIALS[0].roughness.toString());
  const [customRoughness, setCustomRoughness] = useState(false);
  const [ke, setKe] = useState(KE_OPTIONS[0]);
  const [ks, setKs] = useState(KS_OPTIONS[0]);
  const [krg, setKrg] = useState(KRG_OPTIONS[0]);
  const [kc, setKc] = useState(KC_OPTIONS[0]);
  const [customKe, setCustomKe] = useState(false);
  const [customKs, setCustomKs] = useState(false);
  const [customKrg, setCustomKrg] = useState(false);
  const [customKc, setCustomKc] = useState(false);
  const [results, setResults] = useState<DiamResults | null>(null);
  const [error, setError] = useState("");

  const calcViscosity = (Tempa: number) => {
    const Kelv = Tempa + 273.16;
    const Lgu = -11.73 + 1828 / Kelv + 0.01966 * Kelv - 0.00001466 * Kelv ** 2;
    // VBA rounds u to 5 decimal places: Format((10 ^ Lgu) / 100, "0.00000")
    return parseFloat(((10 ** Lgu) / 100).toFixed(5)); // m²/s kinematic
  };

  const calcDensity = (Tempa: number) => {
    const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
    // VBA rounds mespa to 2 decimal places: Format(1000*(1-Fct), "0.00")
    return parseFloat((1000 * (1 - Fct)).toFixed(2));
  };

  const log10 = (x: number) => Math.log(x) / Math.LN10;

  const calculate = () => {
    setError("");
    try {
      const Q = parseFloat(flow);
      const Lt = parseFloat(length);
      const dz = parseFloat(headLossAllowed);
      const Tempa = parseFloat(temp);
      const material = DIAM_MATERIALS[materialIdx];
      const rug = parseFloat(roughness);
      const Ke = parseFloat(ke);
      const Ks = parseFloat(ks);
      const KRg = parseFloat(krg);
      const Kc = parseFloat(kc);

      if (isNaN(Q) || isNaN(Lt) || isNaN(dz) || isNaN(Tempa) || dz <= 0) {
        setError("Verifique se todos os dados estão preenchidos corretamente.");
        return;
      }

      // Viscosity (kinematic, rounded to 5 dp as in VBA)
      const u = calcViscosity(Tempa);
      // Dynamic viscosity for display (Uc = u*1000, x10⁻³ N.s/m²)
      const Uc = parseFloat((u * 1000).toFixed(2));
      // Density (rounded to 2 dp as in VBA)
      const mespa = calcDensity(Tempa);

      // Constants
      const c1 = 6.376e6 * Lt * Q ** 2;
      const c2 = 6375.527 * Q ** 2 * (Ke + Ks + KRg + Kc);

      // Iterative loop to find diameter
      // VBA uses Log (natural log) * 0.434294482 = log10. Here we use log10 directly.
      let oldDi = 1;
      let last_x1 = 1, last_y1 = 1;

      for (let iter = 0; iter < 1000; iter++) {
        const V1 = 353.6776 * Q / oldDi ** 2;
        const NR1 = mespa * V1 * (oldDi / 1000) / u;
        const s1 = 0.12363 * NR1 * (rug / oldDi) + 2.3 * log10(0.3984 * NR1);
        const x1 = 0.3984 * NR1;
        const y1 = (0.8686 * s1) ** ((s1 - 0.645) / (s1 + 0.39));
        const f1 = (2 * log10(x1 / y1)) ** -2;

        last_x1 = x1;
        last_y1 = y1;

        const newDi = ((c1 * (f1 / oldDi) + c2) / dz) ** 0.25;
        const deltaDi = newDi - oldDi;
        oldDi = newDi;

        if (Math.abs(deltaDi / newDi) < 0.001) {
          break;
        }
      }

      const D = oldDi;

      // Final calculations — VBA uses TextBox6 rounded to 2dp for V
      const V = parseFloat((353.67765 * Q / D ** 2).toFixed(2));
      // VBA: TextBox7 = Format(mespa * V * (D/1000) / u, "0") → integer
      const NR = Math.round(mespa * V * (D / 1000) / u);

      // VBA TextBox8 uses x1/y1 from last loop iteration (not recomputed with final NR)
      const f = (2 * log10(last_x1 / last_y1)) ** -2;

      // Head loss: VBA uses TextBox8 (f rounded to 4 dp) and D
      const fRounded = parseFloat(f.toFixed(4));
      const hf = 6.376e6 * fRounded * Lt * Q ** 2 / D ** 5;

      setResults({
        diameter: D.toFixed(2),
        velocity: V.toFixed(2),
        reynolds: NR.toString(),
        frictionFactor: f.toFixed(4),
        headLoss: hf.toFixed(3),
        viscosity: Uc.toFixed(2),
        density: mespa.toFixed(2),
      });
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };


  return (
    <div className="p-6 space-y-5">
      {/* Inputs row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Vazão (m³/h)" value={flow} onChange={setFlow} placeholder="Ex: 28" />
        <InputField label="Comprimento (m)" value={length} onChange={setLength} placeholder="Ex: 100" />
      </div>

      {/* Inputs row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Desnível (m)" value={headLossAllowed} onChange={setHeadLossAllowed} placeholder="Ex: 5" />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
            Temperatura (°C)
          </label>
          <input
            type="number"
            value={temp}
            onChange={e => setTemp(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>
      </div>

      {/* Material */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Material da Tubulação
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIAM_MATERIALS.map((m, i) => (
            <button
              key={m.label}
              onClick={() => { setMaterialIdx(i); if (!customRoughness) setRoughness(m.roughness.toString()); }}
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
      </div>

      {/* Rugosidade Absoluta */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
          Rugosidade Absoluta (mm)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={roughness}
            onChange={e => { if (customRoughness) setRoughness(e.target.value); }}
            readOnly={!customRoughness}
            placeholder="Ex: 0.003334"
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner ${!customRoughness ? 'cursor-default' : ''}`}
            style={{ borderColor: "hsl(var(--border))" }}
          />
          <button
            type="button"
            onClick={() => setCustomRoughness(!customRoughness)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
              customRoughness
                ? "gradient-primary text-primary-foreground border-transparent"
                : "bg-muted text-muted-foreground border-border hover:border-primary"
            }`}
            title={customRoughness ? "Usar valores pré-definidos" : "Digitar valor personalizado"}
          >
            {customRoughness ? "Lista" : "✎"}
          </button>
        </div>
      </div>

      {/* Coeficientes de perda localizada */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Coeficientes de Perda Localizada (K)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Ke — Entrada" value={ke} onChange={setKe} options={KE_OPTIONS} id="dl-ke" custom={customKe} onToggleCustom={() => setCustomKe(!customKe)} />
          <SelectField label="Ks — Saída" value={ks} onChange={setKs} options={KS_OPTIONS} id="dl-ks" custom={customKs} onToggleCustom={() => setCustomKs(!customKs)} />
          <SelectField label="KRg — Reg. Gaveta" value={krg} onChange={setKrg} options={KRG_OPTIONS} id="dl-krg" custom={customKrg} onToggleCustom={() => setCustomKrg(!customKrg)} />
          <SelectField label="Kc — Curva 90°" value={kc} onChange={setKc} options={KC_OPTIONS} id="dl-kc" custom={customKc} onToggleCustom={() => setCustomKc(!customKc)} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 font-body">
          Soma K = {(parseFloat(ke) + parseFloat(ks) + parseFloat(krg) + parseFloat(kc)).toFixed(1)}
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
        <Ruler size={18} />
        Calcular Diâmetro
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-semibold text-foreground text-base">Resultados</h3>

          {/* Diameter highlight */}
          <div className="equation-block px-5 py-4">
            <p className="text-xs text-muted-foreground font-body mb-1">Diâmetro calculado (D)</p>
            <p className="font-display text-2xl font-bold text-primary">
              {results.diameter} <span className="text-base font-body font-normal">mm</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Velocidade" value={`${results.velocity} m/s`} />
            <ResultCard label="Número de Reynolds" value={results.reynolds} />
            <ResultCard label="Fator de Atrito (f)" value={results.frictionFactor} highlight />
            <ResultCard label="Perda de Carga (hf)" value={`${results.headLoss} m.c.a.`} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-body text-muted-foreground">
            <span>Viscosidade dinâmica: {results.viscosity} × 10⁻³ N.s/m²</span>
            <span>Massa específica: {results.density} kg/m³</span>
          </div>
        </div>
      )}
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
        className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground no-spinner"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, id, custom, onToggleCustom }: { label: string; value: string; onChange: (v: string) => void; options: string[]; id: string; custom: boolean; onToggleCustom: () => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">
        {label}
      </label>
      <div className="flex gap-1.5">
        {custom ? (
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            step="any"
            className="flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 no-spinner"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        ) : (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={onToggleCustom}
          className={`px-2.5 py-2 rounded-lg border text-xs font-semibold font-body transition-all ${
            custom
              ? "gradient-primary text-primary-foreground border-transparent"
              : "bg-muted text-muted-foreground border-border hover:border-primary"
          }`}
          title={custom ? "Usar valores pré-definidos" : "Digitar valor personalizado"}
        >
          {custom ? "Lista" : "✎"}
        </button>
      </div>
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
