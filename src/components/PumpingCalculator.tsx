import { useState } from "react";
import { Droplets, ArrowUp, ArrowDown, Gauge, Pencil, RotateCcw, Printer } from "lucide-react";
import { printReport, br } from "@/lib/printReport";

// ── Constants ──
const SUCTION_DIAMETERS = [48.1, 72.5, 97.6, 120, 144, 200, 250, 300, 350];
const DISCHARGE_DIAMETERS = [48.1, 72.5, 97.6, 120, 144, 200, 250, 300, 350];
const NOZZLE_DIAMETERS = [100, 125, 200, 250];
const GATE_VALVE_DIAMETERS = [200, 250];
const TEMPERATURES = [15, 20, 25, 30];

// Preset values for singularity coefficients
const S_KE_OPTIONS = [0.5, 1.0, 0.78];
const S_KC_OPTIONS = [0.4, 0.6, 0.9, 1.2];
const S_KVG_OPTIONS = [0.2, 0.1, 0.15];
const S_KVPC_OPTIONS = [10, 8, 12];
const S_KREX_OPTIONS = [0.2, 0.3, 0.5];

const D_KVGR_OPTIONS = [0.2, 0.1, 0.15];
const D_KVR_OPTIONS = [2.5, 1.5, 3.5];
const D_KCR_OPTIONS = [0.4, 0.6, 0.9, 1.2];
const D_KAC_OPTIONS = [0.3, 0.2, 0.5];
const D_KAGD_OPTIONS = [0.3, 0.2, 0.1];

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
      className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground no-spinner"
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

function ComboInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: number[]; placeholder?: string }) {
  const [custom, setCustom] = useState(false);
  const isPreset = !custom && options.map(String).includes(value);
  return (
    <div className="flex gap-1">
      {custom ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground no-spinner"
          style={{ borderColor: "hsl(var(--border))" }}
        />
      ) : (
        <select
          value={isPreset ? value : ""}
          onChange={e => onChange(e.target.value)}
          className="w-full px-1 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          {options.map(o => <option key={o} value={String(o)}>{o}</option>)}
        </select>
      )}
      <button
        onClick={() => { setCustom(!custom); if (custom) { onChange(String(options[0])); } }}
        title={custom ? "Usar valores predefinidos" : "Digitar valor personalizado"}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {custom ? <RotateCcw size={12} /> : <Pencil size={12} />}
      </button>
    </div>
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
  const [sCustomRoughness, setSCustomRoughness] = useState(false);
  const [sRoughnessValue, setSRoughnessValue] = useState("");
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
  const [dCustomRoughness, setDCustomRoughness] = useState(false);
  const [dRoughnessValue, setDRoughnessValue] = useState("");
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
      const roughness = sCustomRoughness && sRoughnessValue !== "" ? parseFloat(sRoughnessValue) : PIPE_MATERIALS[sMaterialIdx].roughness;
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
      const { f, regime } = calcFrictionFactor(Re, roughness, D);

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
      const dRough = dCustomRoughness && dRoughnessValue !== "" ? parseFloat(dRoughnessValue) : PIPE_MATERIALS[dMaterialIdx].roughness;
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
      const { f } = calcFrictionFactor(Re, dRough, D);

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

  const sRoughness = sCustomRoughness && sRoughnessValue !== "" ? parseFloat(sRoughnessValue) : PIPE_MATERIALS[sMaterialIdx].roughness;
  const dRoughness = dCustomRoughness && dRoughnessValue !== "" ? parseFloat(dRoughnessValue) : PIPE_MATERIALS[dMaterialIdx].roughness;

  const handlePrint = () => {
    if (!sResults && !dResults) {
      alert("Calcule primeiro a aba Sucção (e opcionalmente o Recalque) para gerar o relatório.");
      return;
    }
    const sections: any[] = [];
    if (sResults) {
      sections.push({
        title: "1. Sucção — Dados de Entrada",
        rows: [
          { label: "Vazão (Q)", value: br(sFlow, "m³/h") },
          { label: "Comprimento (L)", value: br(sLength, "m") },
          { label: "Diâmetro (D)", value: br(sDiameter, "mm") },
          { label: "Material", value: PIPE_MATERIALS[sMaterialIdx].label },
          { label: "Rugosidade absoluta (ε)", value: br(String(sRoughness), "mm") },
          { label: "Diâmetro do bocal", value: br(sNozzleDiam, "mm") },
          { label: "Altitude", value: br(sAltitude, "m") },
          { label: "Temperatura", value: br(sTemp, "°C") },
          { label: "NPSH requerido", value: br(sNpsh, "m") },
          { label: "Ke / Kc / Kreg / Kvpc / Krex", value: `${br(sKe)} / ${br(sKc)} / ${br(sKvg)} / ${br(sKvpc)} / ${br(sKrex)}` },
        ],
      });
      sections.push({
        title: "2. Sucção — Resultados",
        highlightLast: true,
        rows: [
          { label: "Viscosidade dinâmica (μ)", value: `${sResults.viscosity} × 10⁻³ N.s/m²` },
          { label: "Massa específica (ρ)", value: br(sResults.density, "kg/m³") },
          { label: "Peso específico (γ)", value: br(sResults.specificWeight, "N/m³") },
          { label: "Velocidade (V)", value: br(sResults.velocity, "m/s") },
          { label: "Número de Reynolds (Re)", value: br(sResults.reynolds) },
          { label: "Fator de atrito (f)", value: br(sResults.frictionFactor) },
          { label: "Regime de escoamento", value: sResults.regime },
          { label: "Perda de carga distribuída", value: br(sResults.distributedLoss, "m") },
          { label: "Perda de carga singular", value: br(sResults.singularLoss, "m") },
          { label: "Pressão atmosférica local (Patm)", value: br(sResults.atmPressure, "m") },
          { label: "Pressão de vapor d'água", value: br(sResults.vaporPressure, "m") },
          { label: "Altura crítica de sucção", value: br(sResults.criticalHeight, "m") },
          { label: "NPSH disponível", value: br(sResults.npshAvailable, "m") },
          ...(sResults.inletPressureMca ? [
            { label: "Pressão na admissão (KPa)", value: br(sResults.inletPressureKpa) },
            { label: "Pressão na admissão (mca)", value: br(sResults.inletPressureMca) },
          ] : []),
          { label: "Perda de carga total na sucção", value: br(sResults.totalLoss, "m") },
        ],
      });
      if (sResults.message) {
        sections.push({
          title: "Observação",
          rows: [{ label: "Resultado da análise", value: sResults.message }],
        });
      }
    }
    if (dResults) {
      sections.push({
        title: "3. Recalque — Dados de Entrada",
        rows: [
          { label: "Comprimento (L)", value: br(dLength, "m") },
          { label: "Diâmetro (D)", value: br(dDiameter, "mm") },
          { label: "Material", value: PIPE_MATERIALS[dMaterialIdx].label },
          { label: "Rugosidade absoluta (ε)", value: br(String(dRoughness), "mm") },
          { label: "Altura estática de recalque", value: br(dAer, "m") },
          { label: "Distância entrada/saída da bomba", value: br(dD, "m") },
          { label: "Diâmetro do bocal", value: br(dNozzleDiam, "mm") },
          { label: "Diâmetro reg. gaveta", value: br(dGavDiam, "mm") },
          { label: "Tipo de descarga", value: dDischargeType },
          { label: "Pressão de serviço/saída adicional", value: br(dPsd, "m") },
          { label: "Filtros", value: br(dFilt, "m") },
          { label: "Rendimento da bomba", value: br(dEff, "%") },
          { label: "Krg / Kvr / Kc / Kac / Kagd", value: `${br(dKvgr)} / ${br(dKvr)} / ${br(dKcr)} / ${br(dKac)} / ${br(dKagd)}` },
        ],
      });
      sections.push({
        title: "4. Recalque — Resultados",
        highlightLast: true,
        rows: [
          { label: "Velocidade (V)", value: br(dResults.velocity, "m/s") },
          { label: "Número de Reynolds (Re)", value: br(dResults.reynolds) },
          { label: "Fator de atrito (f)", value: br(dResults.frictionFactor) },
          { label: "Perda de carga distribuída", value: br(dResults.distributedLoss, "m") },
          { label: "Perda de carga singular", value: br(dResults.singularLoss, "m") },
          { label: "Perda de carga total no recalque", value: br(dResults.totalLoss, "m") },
          { label: "Perda de carga total no sistema", value: br(dResults.totalSystemLoss, "m") },
          { label: "Altura dinâmica no recalque", value: br(dResults.dynamicHeight, "m") },
          { label: "Pressão na saída (KPa)", value: br(dResults.outletPressureKpa) },
          { label: "Pressão na saída (mca)", value: br(dResults.outletPressureMca) },
          { label: "Altura manométrica da bomba (Hb)", value: br(dResults.pumpHead, "m") },
          { label: "Potência da bomba", value: `${br(dResults.powerKw, "kW")} / ${br(dResults.powerCv, "CV")}` },
        ],
      });
    }
    printReport({
      calculator: "Bombeamento",
      subtitle: "Dimensionamento hidráulico de sucção e recalque",
      sections,
    });
  };

  const PrintBtn = () => (
    <button onClick={handlePrint} title="Imprimir / Salvar PDF"
      className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-semibold font-body flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
      <Printer size={16} />
    </button>
  );

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
          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Dados da Tubulação à montante/Sucção
            </legend>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Vazão (m³/h)">
                <NumInput value={sFlow} onChange={setSFlow} placeholder="Ex: 210" />
              </Field>
              <Field label="Diâmetro (mm)">
                <ComboInput value={sDiameter} onChange={setSDiameter} options={SUCTION_DIAMETERS} placeholder="Ex: 250" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Comprimento (m)">
                <NumInput value={sLength} onChange={setSLength} placeholder="Ex: 12" />
              </Field>
              <Field label="Material do tubo">
                <SelectInput value={String(sMaterialIdx)} onChange={v => { setSMaterialIdx(Number(v)); setSCustomRoughness(false); setSRoughnessValue(""); }} options={PIPE_MATERIALS.map((m, i) => ({ value: String(i), label: m.label }))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Rugosidade absoluta (mm)">
                <div className="flex gap-1.5">
                  {sCustomRoughness ? (
                    <NumInput value={sRoughnessValue} onChange={setSRoughnessValue} placeholder="Valor personalizado" />
                  ) : (
                    <input type="text" readOnly value={PIPE_MATERIALS[sMaterialIdx].roughness}
                      className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-muted text-foreground cursor-not-allowed"
                      style={{ borderColor: "hsl(var(--border))" }} />
                  )}
                  <button
                    onClick={() => { setSCustomRoughness(!sCustomRoughness); setSRoughnessValue(""); }}
                    title={sCustomRoughness ? "Usar valor do material" : "Digitar valor personalizado"}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    {sCustomRoughness ? <RotateCcw size={14} /> : <Pencil size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Diâmetro do bocal da bomba (mm)">
                <ComboInput value={sNozzleDiam} onChange={setSNozzleDiam} options={NOZZLE_DIAMETERS} placeholder="Ex: 125" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Peças / Singularidades
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <Field label="ENTRADA">
                <ComboInput value={sKe} onChange={setSKe} options={S_KE_OPTIONS} placeholder="0.5" />
              </Field>
              <Field label="CURVA/UNIÃO">
                <ComboInput value={sKc} onChange={setSKc} options={S_KC_OPTIONS} placeholder="0.4" />
              </Field>
              <Field label="REGISTRO">
                <ComboInput value={sKvg} onChange={setSKvg} options={S_KVG_OPTIONS} placeholder="0.2" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kvpé-crivo">
                <ComboInput value={sKvpc} onChange={setSKvpc} options={S_KVPC_OPTIONS} placeholder="10" />
              </Field>
              <Field label="Kr excêntrica">
                <ComboInput value={sKrex} onChange={setSKrex} options={S_KREX_OPTIONS} placeholder="0.2" />
              </Field>
            </div>
          </fieldset>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Altitude (m)">
              <NumInput value={sAltitude} onChange={setSAltitude} placeholder="Ex: 480" />
            </Field>
            <Field label="NPSH req. (m)">
              <NumInput value={sNpsh} onChange={setSNpsh} placeholder="Ex: 3.6" />
            </Field>
            <Field label="T da água (°C)">
              <NumInput value={sTemp} onChange={setSTemp} placeholder="Ex: 20" />
            </Field>
          </div>

          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Posição da Tubulação na Sucção
            </legend>
            <div className="flex gap-3 flex-wrap">
              {([
                { val: "critical" as SuctionMode, label: "Positiva" },
                { val: "submerged" as SuctionMode, label: "Negativa" },
              ]).map(opt => (
                <label key={opt.val} className="flex items-center gap-1.5 text-sm font-body cursor-pointer">
                  <input type="radio" name="suctionPos" checked={sMode === opt.val || (opt.val === "critical" && sMode === "predefined")}
                    onChange={() => setSMode(opt.val)}
                    className="accent-primary" />
                  {opt.label}
                </label>
              ))}
            </div>
            {(sMode === "critical" || sMode === "predefined") && (
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-body cursor-pointer">
                  <input type="checkbox" checked={sMode === "predefined"}
                    onChange={e => setSMode(e.target.checked ? "predefined" : "critical")}
                    className="accent-primary" />
                  Altura estática de sucção positiva pré-definida
                </label>
                {sMode === "predefined" && (
                  <Field label="Altura de sucção (m)">
                    <NumInput value={sZspre} onChange={setSZspre} placeholder="Ex: 2" />
                  </Field>
                )}
              </div>
            )}
            {sMode === "submerged" && (
              <Field label="Altura de sucção afogada (m)">
                <NumInput value={sZsAfog} onChange={setSZsAfog} placeholder="Ex: 2" />
              </Field>
            )}
          </fieldset>

          {sError && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {sError}</div>
          )}

          <div className="flex gap-2">
            <button onClick={calcSuction} className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
              <Droplets size={18} />
              CALCULAR
            </button>
            <PrintBtn />
          </div>

          {sResults && (
            <div className="space-y-3 pt-2">
              <fieldset className="border border-border rounded-xl p-4 space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Resultados</legend>
                <div className="grid grid-cols-2 gap-2">
                  <ResCard label="Peso específico da água (N/m³)" value={sResults.specificWeight} />
                  <ResCard label="Número de Reynolds" value={sResults.reynolds} />
                  <ResCard label="Fator de atrito (f)" value={sResults.frictionFactor} highlight />
                  <ResCard label="Velocidade da água (m/s)" value={sResults.velocity} />
                  <ResCard label="Perda de carga distribuída (m)" value={sResults.distributedLoss} />
                  <ResCard label="Perda de carga singular (m)" value={sResults.singularLoss} />
                  <ResCard label="Perda de carga total (m)" value={sResults.totalLoss} highlight />
                  <ResCard label="Patm Local (m)" value={sResults.atmPressure} />
                  <ResCard label="Pressão do vapor d'água (m)" value={sResults.vaporPressure} />
                  <ResCard label="Altura estática de sucção crítica" value={sResults.criticalHeight} />
                  <ResCard label="NPSH disponível" value={sResults.npshAvailable} />
                </div>
                {sResults.inletPressureMca && (
                  <div className="grid grid-cols-2 gap-2">
                    <ResCard label="Pressão na admissão - Em (KPa)" value={sResults.inletPressureKpa} />
                    <ResCard label="Pressão na admissão - Em (mca)" value={sResults.inletPressureMca} />
                  </div>
                )}
              </fieldset>
              {sResults.message && (
                <div className="bg-primary/10 text-primary text-xs px-4 py-2.5 rounded-lg font-body font-semibold">
                  {sResults.message}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground">
                <span>Viscosidade dinâmica: {sResults.viscosity} × 10⁻³ N.s/m²</span>
                <span>Massa específica: {sResults.density} kg/m³</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "discharge" && (
        <div className="space-y-4">
          {!sResults && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
              ⚠ Calcule primeiro a aba Montagem à montante para obter dados compartilhados.
            </div>
          )}

          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Descarga da tubulação à jusante
            </legend>
            <div className="flex gap-3 flex-wrap">
              {([
                { val: "livre" as const, label: "Livre" },
                { val: "imersa" as const, label: "Imersa" },
                { val: "pressurizada" as const, label: "Pressurizada" },
              ]).map(opt => (
                <label key={opt.val} className="flex items-center gap-1.5 text-sm font-body cursor-pointer">
                  <input type="radio" name="dischargeType" checked={dDischargeType === opt.val}
                    onChange={() => setDDischargeType(opt.val)}
                    className="accent-primary" />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Dados da Tubulação à jusante
            </legend>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Comprimento (m)">
                <NumInput value={dLength} onChange={setDLength} placeholder="Ex: 272.8" />
              </Field>
              <Field label="Material do tubo">
                <SelectInput value={String(dMaterialIdx)} onChange={v => { setDMaterialIdx(Number(v)); setDCustomRoughness(false); setDRoughnessValue(""); }} options={PIPE_MATERIALS.map((m, i) => ({ value: String(i), label: m.label }))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Diâmetro (mm)">
                <ComboInput value={dDiameter} onChange={setDDiameter} options={DISCHARGE_DIAMETERS} placeholder="Ex: 120" />
              </Field>
              <Field label="Rug. absoluta (mm)">
                <div className="flex gap-1.5">
                  {dCustomRoughness ? (
                    <NumInput value={dRoughnessValue} onChange={setDRoughnessValue} placeholder="Valor personalizado" />
                  ) : (
                    <input type="text" readOnly value={PIPE_MATERIALS[dMaterialIdx].roughness}
                      className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-muted text-foreground cursor-not-allowed"
                      style={{ borderColor: "hsl(var(--border))" }} />
                  )}
                  <button
                    onClick={() => { setDCustomRoughness(!dCustomRoughness); setDRoughnessValue(""); }}
                    title={dCustomRoughness ? "Usar valor do material" : "Digitar valor personalizado"}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    {dCustomRoughness ? <RotateCcw size={14} /> : <Pencil size={14} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Altura estática de recalque (m)">
                <NumInput value={dAer} onChange={setDAer} placeholder="Ex: 10" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Distância entre entrada e saída da bomba (m)">
                <NumInput value={dD} onChange={setDD} placeholder="Ex: 0.5" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Diâmetro do bocal na descarga da bomba (mm)">
                <ComboInput value={dNozzleDiam} onChange={setDNozzleDiam} options={NOZZLE_DIAMETERS} placeholder="Ex: 125" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="border border-border rounded-xl p-4 space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">
              Peças / Singularidades
            </legend>
            <div className="grid grid-cols-5 gap-2">
              <Field label="Krgaveta">
                <ComboInput value={dKvgr} onChange={setDKvgr} options={D_KVGR_OPTIONS} placeholder="0.2" />
              </Field>
              <Field label="Kvretenção">
                <ComboInput value={dKvr} onChange={setDKvr} options={D_KVR_OPTIONS} placeholder="2.5" />
              </Field>
              <Field label="Kcurvas">
                <ComboInput value={dKcr} onChange={setDKcr} options={D_KCR_OPTIONS} placeholder="0.4" />
              </Field>
              <Field label="Ka concêntrica">
                <ComboInput value={dKac} onChange={setDKac} options={D_KAC_OPTIONS} placeholder="0.3" />
              </Field>
              <Field label="Ka gradual">
                <ComboInput value={dKagd} onChange={setDKagd} options={D_KAGD_OPTIONS} placeholder="0.3" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Diâmetro do registro de gaveta (mm)">
                <ComboInput value={dGavDiam} onChange={setDGavDiam} options={GATE_VALVE_DIAMETERS} placeholder="Ex: 200" />
              </Field>
              <Field label="Rendimento da Bomba (%)">
                <NumInput value={dEff} onChange={setDEff} placeholder="Ex: 75" />
              </Field>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-3">
            <Field label="Filtros">
              <NumInput value={dFilt} onChange={setDFilt} placeholder="Ex: 0" />
            </Field>
          </div>

          {dError && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">⚠ {dError}</div>
          )}

          <div className="flex gap-2">
            <button onClick={calcDischarge} className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity">
              <Gauge size={18} />
              CALCULAR
            </button>
            <PrintBtn />
          </div>

          {dResults && (
            <div className="space-y-3 pt-2">
              <fieldset className="border border-border rounded-xl p-4 space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Resultados</legend>
                <div className="grid grid-cols-2 gap-2">
                  <ResCard label="Número de Reynolds" value={dResults.reynolds} />
                  <ResCard label="Fator de atrito (f)" value={dResults.frictionFactor} highlight />
                  <ResCard label="Velocidade da água (m/s)" value={dResults.velocity} />
                  <ResCard label="Perda de carga distribuída (m)" value={dResults.distributedLoss} />
                  <ResCard label="Perda de carga singular (m)" value={dResults.singularLoss} />
                  <ResCard label="Perda de carga total no recalque (m)" value={dResults.totalLoss} highlight />
                  <ResCard label="Perda de carga total na canalização (m)" value={dResults.totalSystemLoss} />
                  <ResCard label="Altura dinâmica no recalque (m)" value={dResults.dynamicHeight} />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ResCard label="Carga da bomba (m)" value={dResults.pumpHead} highlight />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ResCard label="Pressão na saída - Em (KPa)" value={dResults.outletPressureKpa} />
                  <ResCard label="Pressão na saída - Em (mca)" value={dResults.outletPressureMca} />
                </div>
              </fieldset>
              <fieldset className="border border-border rounded-xl p-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 font-body">Potência da Bomba</legend>
                <div className="grid grid-cols-2 gap-2">
                  <ResCard label="Em (kW)" value={dResults.powerKw} highlight />
                  <ResCard label="Em (CV)" value={dResults.powerCv} highlight />
                </div>
              </fieldset>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
