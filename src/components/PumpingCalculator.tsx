import { useState } from "react";
import { Droplets, ArrowUp, ArrowDown, Gauge } from "lucide-react";

// ── Constants ──
const SUCTION_DIAMETERS = [48.1, 72.5, 97.6, 120, 144, 200, 250, 300, 350];
const DISCHARGE_DIAMETERS = [48.1, 72.5, 97.6, 120, 144, 200, 250, 300, 350];
const NOZZLE_DIAMETERS = [100, 125, 200, 250];
const GATE_VALVE_DIAMETERS = [200, 250];
const TEMPERATURES = [15, 20, 25, 30];

const PIPE_MATERIALS = [
  { label: "PEBD", roughness: 0.008116 },
  { label: "PVC", roughness: 0.003334 },
  { label: "AGALVD°", roughness: 0.15 },
  { label: "AZINCD°", roughness: 0.15 },
];

type SuctionMode = "predefined" | "critical" | "submerged";

interface SuctionResults {
  viscosity: string;
  density: string;
  specificWeight: string;
  vaporPressure: string;
  velocity: string;
  reynolds: string;
  frictionFactor: string;
  regime: string;
  distributedLoss: string;
  singularLoss: string;
  totalLoss: string;
  atmPressure: string;
  criticalHeight: string;
  npshAvailable: string;
  inletPressureKpa: string;
  inletPressureMca: string;
  message: string;
}

interface DischargeResults {
  velocity: string;
  reynolds: string;
  frictionFactor: string;
  distributedLoss: string;
  singularLoss: string;
  totalLoss: string;
  totalSystemLoss: string;
  dynamicHeight: string;
  outletPressureMca: string;
  outletPressureKpa: string;
  pumpHead: string;
  powerKw: string;
  powerCv: string;
}

// ── Utility functions ──
// Matches VBA Format() — rounds to fixed decimals and returns number
const fmt = (v: number, d: number): number => parseFloat(v.toFixed(d));

const calcViscosity = (T: number) => {
  const K = T + 273.16;
  const Lgu = -11.73 + 1828 / K + 0.01966 * K - 0.00001466 * K ** 2;
  return fmt((10 ** Lgu) / 100, 5); // VBA: Format(..., "0.00000")
};

const calcDensity = (T: number) => {
  const Fct = ((T - 3.983035) ** 2) * (T + 301.797) / (522528.9 * (T + 69.34881));
  return fmt(1000 * (1 - Fct), 2); // VBA: Format(..., "0.00")
};

// Colebrook iteration matching VBA exactly (Do While, divides by new value, uses Log*0.434294482)
const calcFrictionFactor = (Re: number, roughness: number, diameter: number) => {
  if (Re <= 2300) return { f: fmt(64 / Re, 2), regime: "Escoamento Laminar" };
  let oldf = 1;
  let deltaf = oldf;
  while (Math.abs(deltaf / oldf) >= 0.001) {
    const newf = 1 / (-2 * Math.log(roughness / (3.7 * diameter) + 2.51 / (Re * Math.sqrt(oldf))) * 0.434294482) ** 2;
    deltaf = newf - oldf;
    oldf = newf;
  }
  return { f: fmt(oldf, 4), regime: Re >= 4000 ? "Escoamento Turbulento" : "Região de Transição" };
};

// ── Shared UI ──
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-body">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
      style={{ borderColor: "hsl(var(--border))" }}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ResCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "equation-block" : "bg-muted"}`}>
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className={`font-semibold font-body mt-0.5 text-sm ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
export default function PumpingCalculator() {
  const [tab, setTab] = useState<"suction" | "discharge">("suction");

  // ── Suction state ──
  const [sFlow, setSFlow] = useState("");
  const [sLength, setSLength] = useState("");
  const [sDiameter, setSDiameter] = useState("250");
  const [sMaterialIdx, setSMaterialIdx] = useState(1);
  const [sKe, setSKe] = useState("0.5");
  const [sKvg, setSKvg] = useState("0.2");
  const [sKc, setSKc] = useState("0.4");
  const [sKvpc, setSKvpc] = useState("10");
  const [sKrex, setSKrex] = useState("0.2");
  const [sNozzleDiam, setSNozzleDiam] = useState("125");
  const [sAltitude, setSAltitude] = useState("");
  const [sTemp, setSTemp] = useState("20");
  const [sNpsh, setSNpsh] = useState("");
  const [sMode, setSMode] = useState<SuctionMode>("critical");
  const [sZspre, setSZspre] = useState("");
  const [sZsAfog, setSZsAfog] = useState("");
  const [sResults, setSResults] = useState<SuctionResults | null>(null);
  const [sError, setSError] = useState("");

  // ── Discharge state ──
  const [dLength, setDLength] = useState("");
  const [dDiameter, setDDiameter] = useState("200");
  const [dMaterialIdx, setDMaterialIdx] = useState(1);
  const [dAer, setDAer] = useState("");
  const [dD, setDD] = useState("");
  const [dKvgr, setDKvgr] = useState("0.2");
  const [dKvr, setDKvr] = useState("2.5");
  const [dKcr, setDKcr] = useState("0.4");
  const [dPsd, setDPsd] = useState("");
  const [dFilt, setDFilt] = useState("0");
  const [dEff, setDEff] = useState("75");
  const [dNozzleDiam, setDNozzleDiam] = useState("100");
  const [dKac, setDKac] = useState("0.3");
  const [dKagd, setDKagd] = useState("0.3");
  const [dGavDiam, setDGavDiam] = useState("200");
  const [dDischargeType, setDDischargeType] = useState<"livre" | "imersa" | "pressurizada">("livre");
  const [dResults, setDResults] = useState<DischargeResults | null>(null);
  const [dError, setDError] = useState("");

  // ═══════════════════════════════════
  // SUCTION CALCULATION (matches VBA exactly with intermediate rounding)
  // ═══════════════════════════════════
  const calcSuction = () => {
    setSError("");
    try {
      const Q = parseFloat(sFlow);
      const L = parseFloat(sLength);
      const D = parseFloat(sDiameter);
      const Dboc = parseFloat(sNozzleDiam);
      const mat = PIPE_MATERIALS[sMaterialIdx];
      const Ke = parseFloat(sKe);
      const Kvg = parseFloat(sKvg);
      const Kc = parseFloat(sKc);
      const Kvpc = parseFloat(sKvpc);
      const Krex = parseFloat(sKrex);
      const Alt = parseFloat(sAltitude);
      const T = parseFloat(sTemp);
      const NPSH = parseFloat(sNpsh);
      const Zspre = parseFloat(sZspre) || 0;
      const ZsAfog = parseFloat(sZsAfog) || 0;

      if (isNaN(Q) || isNaN(L) || isNaN(Alt) || isNaN(NPSH) || isNaN(T)) {
        setSError("Preencha todos os campos obrigatórios.");
        return;
      }

      // Viscosity & density (VBA formats these intermediately)
      const u = calcViscosity(T);        // fmt to 5 decimals
      const Uc = fmt(u * 1000, 2);       // VBA: Uc = u * 1000
      const mespa = calcDensity(T);      // fmt to 2 decimals

      // Specific weight (VBA: Format(mespa*9.81, "0.00"), then CDbl)
      const Pes = fmt(mespa * 9.81, 2);

      // Vapor pressure (VBA keeps Pvm at full precision, only display is formatted)
      const logPv = 8.0701 - 1730.6 / (T + 233.4);
      const PvHg = 10 ** logPv;
      const Pvm = PvHg * 10.33 / 760;
      const PvmDisplay = fmt(Pvm, 2);

      // Velocity (VBA: Format(..., "0.000"))
      const V = fmt(353.6775 * Q / D ** 2, 3);

      // Reynolds (VBA: Format(..., "0") — integer)
      const Re = fmt(mespa * V * (D / 1000) / u, 0);

      // Friction factor (VBA uses integer Re in Colebrook, result formatted to 4 decimals)
      const { f, regime } = calcFrictionFactor(Re, mat.roughness, D);

      // Distributed loss (VBA: Format(..., "0.000"))
      const Hfls = fmt(6.376e6 * f * Q ** 2 * L / D ** 5, 3);

      // Singular losses (VBA uses 353.67765 for Vrex, formats intermediately)
      const Vrex = fmt(353.67765 * Q / Dboc ** 2, 3);
      const kredex = fmt(Krex * Vrex ** 2 / 19.62, 3);
      const Hfsg = fmt((Ke + Kvg + Kc + Kvpc) * V ** 2 / 19.62, 3);
      const Hfss = Hfsg + kredex; // VBA: CDbl(Hfsg + kredex)

      // Total suction loss (VBA: Format(Hfls + Hfss, "0.000"))
      const HfTs = fmt(Hfls + Hfss, 3);

      // Atmospheric pressure (VBA: Format then CDbl)
      const Patm = fmt(10.33 * ((293 - 0.0065 * Alt) / 293) ** 5.26, 2);

      // Critical suction height (always computed — VBA: Format(..., "0.000"))
      const Zscritica = fmt(Patm - (NPSH + Pvm + HfTs), 3);

      let npshAvailable = "";
      let inletKpa = "";
      let inletMca = "";
      let message = "";

      if (sMode === "critical") {
        // VBA CheckBox2: sucção positiva crítica
        const NPSHdreal = fmt(1.15 * NPSH, 2);
        const Zsmax = fmt(Patm - (NPSHdreal + HfTs + Pvm), 2);
        npshAvailable = fmt(Patm - (Zscritica + Pvm + HfTs), 2).toFixed(2);
        message = `Altura estática de sucção máxima = ${Zsmax.toFixed(2)} m acima do nível da água (NPSHdisp = ${NPSHdreal.toFixed(2)} m)`;
      } else if (sMode === "submerged") {
        // VBA CheckBox3: sucção negativa (afogada)
        npshAvailable = fmt(Patm + ZsAfog - (Pvm + HfTs), 2).toFixed(2);
        inletMca = fmt(ZsAfog - HfTs - V ** 2 / 19.62, 2).toFixed(2);
        inletKpa = fmt(Pes * parseFloat(inletMca) / 1000, 2).toFixed(2);
        message = `Altura estática de sucção mínima de ${ZsAfog.toFixed(2)} m abaixo do nível inferior da água no reservatório.`;
      } else {
        // VBA CheckBox1: sucção positiva pré-definida
        npshAvailable = fmt(Patm - (Zspre + Pvm + HfTs), 2).toFixed(2);
        inletKpa = fmt(-Pes * (Zspre + (V ** 2 / 19.62) + HfTs) / 1000, 2).toFixed(2);
        inletMca = fmt(-(Zspre + (V ** 2 / 19.62) + HfTs), 2).toFixed(2);
        const Hdsuc = fmt(HfTs + Zspre, 3);
        message = `Altura dinâmica de sucção: ${Hdsuc.toFixed(3)} m`;
      }

      // Velocity warning
      if (V > 1.5) {
        setSError("Velocidade acima de 1,5 m/s. Escolha um diâmetro superior.");
      }

      setSResults({
        viscosity: Uc.toFixed(2),
        density: mespa.toFixed(2),
        specificWeight: Pes.toFixed(2),
        vaporPressure: PvmDisplay.toFixed(2),
        velocity: V.toFixed(3),
        reynolds: Re.toFixed(0),
        frictionFactor: f.toFixed(4),
        regime,
        distributedLoss: Hfls.toFixed(3),
        singularLoss: fmt(Hfss, 3).toFixed(3),
        totalLoss: HfTs.toFixed(3),
        atmPressure: Patm.toFixed(2),
        criticalHeight: Zscritica.toFixed(3),
        npshAvailable,
        inletPressureKpa: inletKpa,
        inletPressureMca: inletMca,
        message,
      });
    } catch {
      setSError("Erro no cálculo. Verifique os dados.");
    }
  };

  // ═══════════════════════════════════
  // DISCHARGE CALCULATION
  // ═══════════════════════════════════
  const calcDischarge = () => {
    setDError("");
    try {
      if (!sResults) {
        setDError("Calcule primeiro a aba Sucção.");
        return;
      }

      const Q = parseFloat(sFlow);
      const L = parseFloat(dLength);
      const D = parseFloat(dDiameter);
      const mat = PIPE_MATERIALS[dMaterialIdx];
      const Aer = parseFloat(dAer);
      const d = parseFloat(dD) || 0;
      const Kvgr = parseFloat(dKvgr);
      const Kvr = parseFloat(dKvr);
      const Kcr = parseFloat(dKcr);
      const Psd = parseFloat(dPsd) || 0;
      const Filt = parseFloat(dFilt) || 0;
      const Eff = parseFloat(dEff);
      const Dbocd = parseFloat(dNozzleDiam);
      const Kac = parseFloat(dKac);
      const Kagd = parseFloat(dKagd);
      const Dgav = parseFloat(dGavDiam);
      const T = parseFloat(sTemp);

      if (isNaN(Q) || isNaN(L) || isNaN(Aer) || isNaN(Eff) || isNaN(D)) {
        setDError("Preencha todos os campos obrigatórios.");
        return;
      }

      const u = calcViscosity(T);
      const mespa = calcDensity(T);
      const Pes = fmt(mespa * 9.81, 2);

      // Velocity (VBA: Format(..., "0.00"))
      const Vrec = fmt(353.6775 * Q / D ** 2, 2);

      // Reynolds (VBA: Format(..., "0"))
      const Re = fmt(mespa * Vrec * (D / 1000) / u, 0);

      // Friction (VBA: Format(..., "0.0000"))
      const { f } = calcFrictionFactor(Re, mat.roughness, D);

      // Distributed loss (VBA: Format(6.3735 * f * (1000*Q)^2 * L / D^5, "0.00"))
      const HfLr = fmt(6.3735 * f * (1000 * Q) ** 2 * L / D ** 5, 2);

      // Singular losses (VBA formats intermediately)
      const vac = fmt(353.6775 * Q / Dbocd ** 2, 2);
      const Hfac = Kac * vac ** 2 / 19.62;
      const vsac = fmt(353.6775 * Q / Dgav ** 2, 2);
      const Hfrgv = Kvgr * vsac ** 2 / 19.62;
      const Hfagrd = Kagd * vsac ** 2 / 19.62;
      const Hfvrt = Kvr * Vrec ** 2 / 19.62;
      const Hfcur = Kcr * Vrec ** 2 / 19.62;
      const HfSr = fmt(Hfac + Hfrgv + Hfagrd + Hfvrt + Hfcur, 3);

      // Total discharge loss
      const Hftr = fmt(HfLr + HfSr, 2);

      // Total system loss
      const HfTsuc = parseFloat(sResults.totalLoss);
      const totalSystem = fmt(Hftr + HfTsuc, 3);

      // Dynamic height
      const dynamicHeight = fmt(Aer + Hftr, 3);

      // Outlet pressure (mca) (VBA: Format(..., "0.00"))
      const PSaida = fmt(Psd + (Aer - d) + Hftr + Filt, 2);
      // Outlet pressure (KPa)
      const PSaidaKpa = fmt(Pes * (Psd + (Aer - d) + Hftr) / 1000, 2);

      // Pump head (VBA: Format(..., "0.00"))
      const PAdm = parseFloat(sResults.inletPressureMca) || 0;
      const Vsuc = parseFloat(sResults.velocity);
      const Hb = fmt((PSaida - PAdm) + ((Vrec ** 2 - Vsuc ** 2) / 19.62) + d, 2);

      // Power (VBA: Format(..., "0.00"))
      const PotKw = fmt((Pes * (Q / 3600) * Hb) / (Eff / 100) / 1000, 2);
      const PotCv = fmt(PotKw / 0.7355, 2);

      if (Vrec > 2) {
        setDError("Velocidade acima de 2 m/s no recalque. Atenção!");
      }

      setDResults({
        velocity: Vrec.toFixed(2),
        reynolds: Re.toFixed(0),
        frictionFactor: f.toFixed(4),
        distributedLoss: HfLr.toFixed(2),
        singularLoss: HfSr.toFixed(3),
        totalLoss: Hftr.toFixed(2),
        totalSystemLoss: totalSystem.toFixed(3),
        dynamicHeight: dynamicHeight.toFixed(3),
        outletPressureMca: PSaida.toFixed(2),
        outletPressureKpa: PSaidaKpa.toFixed(2),
        pumpHead: Hb.toFixed(2),
        powerKw: PotKw.toFixed(2),
        powerCv: PotCv.toFixed(2),
      });
    } catch {
      setDError("Erro no cálculo. Verifique os dados.");
    }
  };

  const sRoughness = PIPE_MATERIALS[sMaterialIdx].roughness;
  const dRoughness = PIPE_MATERIALS[dMaterialIdx].roughness;

  return (
    <div className="p-6 space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("suction")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold font-body transition-all border ${
            tab === "suction"
              ? "gradient-primary text-primary-foreground border-transparent shadow-md"
              : "bg-muted text-muted-foreground border-border hover:border-primary"
          }`}
        >
          <ArrowDown size={14} />
          Montagem à montante
        </button>
        <button
          onClick={() => setTab("discharge")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold font-body transition-all border ${
            tab === "discharge"
              ? "gradient-primary text-primary-foreground border-transparent shadow-md"
              : "bg-muted text-muted-foreground border-border hover:border-primary"
          }`}
        >
          <ArrowUp size={14} />
          Montagem à jusante
        </button>
      </div>

      {/* ═══ SUCTION TAB ═══ */}
      {tab === "suction" && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
            <Droplets size={16} className="text-primary" />
            Tubulação de Sucção
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vazão (m³/h)">
              <NumInput value={sFlow} onChange={setSFlow} placeholder="Ex: 50" />
            </Field>
            <Field label="Comprimento (m)">
              <NumInput value={sLength} onChange={setSLength} placeholder="Ex: 8" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Diâmetro interno (mm)">
              <SelectInput value={sDiameter} onChange={setSDiameter} options={SUCTION_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
            </Field>
            <Field label="Material da tubulação">
              <SelectInput value={String(sMaterialIdx)} onChange={v => setSMaterialIdx(Number(v))} options={PIPE_MATERIALS.map((m, i) => ({ value: String(i), label: m.label }))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Diâmetro do bocal (mm)">
              <SelectInput value={sNozzleDiam} onChange={setSNozzleDiam} options={NOZZLE_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
            </Field>
            <Field label="Temperatura (°C)">
              <SelectInput value={sTemp} onChange={setSTemp} options={TEMPERATURES.map(t => ({ value: String(t), label: `${t} °C` }))} />
            </Field>
          </div>

          {/* Coefficients */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Coeficientes de Perda Localizada</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Ke (entrada)">
                <NumInput value={sKe} onChange={setSKe} placeholder="0.5" />
              </Field>
              <Field label="Kvg (registro)">
                <NumInput value={sKvg} onChange={setSKvg} placeholder="0.2" />
              </Field>
              <Field label="Kc (curva 90°)">
                <NumInput value={sKc} onChange={setSKc} placeholder="0.4" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kvpc (válv. pé c/ crivo)">
                <NumInput value={sKvpc} onChange={setSKvpc} placeholder="0.75" />
              </Field>
              <Field label="Krex (red. excêntrica)">
                <NumInput value={sKrex} onChange={setSKrex} placeholder="0.2" />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Altitude (m)">
              <NumInput value={sAltitude} onChange={setSAltitude} placeholder="Ex: 300" />
            </Field>
            <Field label="NPSH requerido (m)">
              <NumInput value={sNpsh} onChange={setSNpsh} placeholder="Ex: 4" />
            </Field>
          </div>

          {/* Suction mode */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Tipo de Sucção</p>
            <div className="flex gap-2 flex-wrap">
              {([
                { val: "critical" as SuctionMode, label: "Positiva (crítica)" },
                { val: "predefined" as SuctionMode, label: "Positiva (pré-definida)" },
                { val: "submerged" as SuctionMode, label: "Negativa (afogada)" },
              ]).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setSMode(opt.val)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold font-body transition-all border ${
                    sMode === opt.val
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {sMode === "predefined" && (
              <Field label="Altura est. de sucção pré-definida (m)">
                <NumInput value={sZspre} onChange={setSZspre} placeholder="Ex: 3" />
              </Field>
            )}
            {sMode === "submerged" && (
              <Field label="Altura est. de sucção afogada (m)">
                <NumInput value={sZsAfog} onChange={setSZsAfog} placeholder="Ex: 2" />
              </Field>
            )}
          </div>

          {sError && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {sError}</div>
          )}

          <button onClick={calcSuction} className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
            <Droplets size={18} />
            Calcular Sucção
          </button>

          {sResults && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-semibold text-foreground text-sm">Resultados — Sucção</h3>
              <div className="grid grid-cols-2 gap-2">
                <ResCard label="Velocidade" value={`${sResults.velocity} m/s`} />
                <ResCard label="Nº de Reynolds" value={sResults.reynolds} />
                <ResCard label="Fator de atrito (f)" value={sResults.frictionFactor} highlight />
                <ResCard label="Regime" value={sResults.regime} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ResCard label="hf distribuída" value={`${sResults.distributedLoss} m`} />
                <ResCard label="hf singular" value={`${sResults.singularLoss} m`} />
                <ResCard label="hf total" value={`${sResults.totalLoss} m`} highlight />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResCard label="P. atmosférica" value={`${sResults.atmPressure} mca`} />
                <ResCard label="Pressão de vapor" value={`${sResults.vaporPressure} mca`} />
                <ResCard label="Zs crítica" value={`${sResults.criticalHeight} m`} highlight />
                <ResCard label="NPSH disponível" value={`${sResults.npshAvailable} m`} />
              </div>
              {sResults.inletPressureMca && (
                <div className="grid grid-cols-2 gap-2">
                  <ResCard label="P. entrada (mca)" value={`${sResults.inletPressureMca} m`} />
                  <ResCard label="P. entrada (KPa)" value={`${sResults.inletPressureKpa} KPa`} />
                </div>
              )}
              {sResults.message && (
                <div className="bg-primary/10 text-primary text-xs px-4 py-2.5 rounded-lg font-body font-semibold">
                  {sResults.message}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground">
                <span>Viscosidade: {sResults.viscosity} × 10⁻³ N.s/m²</span>
                <span>Massa específica: {sResults.density} kg/m³</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ DISCHARGE TAB ═══ */}
      {tab === "discharge" && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
            <Gauge size={16} className="text-primary" />
            Tubulação de Recalque
          </h3>

          {!sResults && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
              ⚠ Calcule primeiro a aba Sucção para obter dados compartilhados.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Comprimento (m)">
              <NumInput value={dLength} onChange={setDLength} placeholder="Ex: 200" />
            </Field>
            <Field label="Diâmetro interno (mm)">
              <SelectInput value={dDiameter} onChange={setDDiameter} options={DISCHARGE_DIAMETERS.map(d => ({ value: String(d), label: `${d} mm` }))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Material da tubulação">
              <SelectInput value={String(dMaterialIdx)} onChange={v => setDMaterialIdx(Number(v))} options={PIPE_MATERIALS.map((m, i) => ({ value: String(i), label: m.label }))} />
            </Field>
            <Field label="Altura estática recalque (m)">
              <NumInput value={dAer} onChange={setDAer} placeholder="Ex: 30" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Desnível (d) (m)">
              <NumInput value={dD} onChange={setDD} placeholder="Ex: 1" />
            </Field>
            <Field label="Pressão de serviço (mca)">
              <NumInput value={dPsd} onChange={setDPsd} placeholder="Ex: 20" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Perda no filtro (m)">
              <NumInput value={dFilt} onChange={setDFilt} placeholder="Ex: 3" />
            </Field>
            <Field label="Rendimento da bomba (%)">
              <NumInput value={dEff} onChange={setDEff} placeholder="Ex: 70" />
            </Field>
          </div>

          {/* Discharge coefficients */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Coeficientes e Conexões — Recalque</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Kvgr (registro)">
                <NumInput value={dKvgr} onChange={setDKvgr} placeholder="0.2" />
              </Field>
              <Field label="Kvr (válv. retenção)">
                <NumInput value={dKvr} onChange={setDKvr} placeholder="2.5" />
              </Field>
              <Field label="Kcr (curvas)">
                <NumInput value={dKcr} onChange={setDKcr} placeholder="0.4" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Diam. bocal descarga (mm)">
                <NumInput value={dNozzleDiam} onChange={setDNozzleDiam} placeholder="100" />
              </Field>
              <Field label="Kac (ampl. concêntrica)">
                <NumInput value={dKac} onChange={setDKac} placeholder="0.3" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kagd (ampl. gradual)">
                <NumInput value={dKagd} onChange={setDKagd} placeholder="0.3" />
              </Field>
              <Field label="Diam. registro gaveta (mm)">
                <NumInput value={dGavDiam} onChange={setDGavDiam} placeholder="200" />
              </Field>
            </div>
          </div>

          {dError && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {dError}</div>
          )}

          <button onClick={calcDischarge} className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
            <Gauge size={18} />
            Calcular Recalque
          </button>

          {dResults && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-semibold text-foreground text-sm">Resultados — Recalque</h3>
              <div className="grid grid-cols-2 gap-2">
                <ResCard label="Velocidade" value={`${dResults.velocity} m/s`} />
                <ResCard label="Nº de Reynolds" value={dResults.reynolds} />
                <ResCard label="Fator de atrito (f)" value={dResults.frictionFactor} highlight />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ResCard label="hf distribuída" value={`${dResults.distributedLoss} m`} />
                <ResCard label="hf singular" value={`${dResults.singularLoss} m`} />
                <ResCard label="hf total recalque" value={`${dResults.totalLoss} m`} highlight />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResCard label="hf total sistema" value={`${dResults.totalSystemLoss} m`} />
                <ResCard label="Alt. dinâmica recalque" value={`${dResults.dynamicHeight} m`} />
                <ResCard label="P. saída (mca)" value={`${dResults.outletPressureMca} m`} />
                <ResCard label="P. saída (KPa)" value={`${dResults.outletPressureKpa} KPa`} />
              </div>
              <div className="equation-block px-5 py-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Carga da Bomba (Hb)</p>
                <p className="font-display text-2xl font-bold text-primary">{dResults.pumpHead} <span className="text-base font-body font-normal">m.c.a.</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResCard label="Potência (kW)" value={`${dResults.powerKw} kW`} highlight />
                <ResCard label="Potência (CV)" value={`${dResults.powerCv} CV`} highlight />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
