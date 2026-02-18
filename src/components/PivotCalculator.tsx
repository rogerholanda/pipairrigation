import { useState } from "react";
import { Waves } from "lucide-react";

// ---- Types ----
type DiamConfig = "1" | "2" | "3";
type Material = "AGD" | "PVC";

interface Seg {
  label: string;
  hf: string;
  f: string;
  v: string;
  nr: string;
  q: string;
  d: string;
  F: string;
}

interface PivotResults {
  Lp: string;
  Ab: string;
  Qb: string;
  Qin: string;
  gr: string;
  Leq: string;
  segments: Seg[];
  Hftotal: string;
  Hvel: string;
  Hin: string;
  Hpp: string;
  viscosity: string;
  density: string;
}

// ---- Helpers ----
const ln = Math.log;

function calcViscosity(Tempa: number) {
  const Tkelv = Tempa + 273.16;
  const Lgu = -11.73 + 1828 / Tkelv + 0.01966 * Tkelv - 0.00001466 * Tkelv ** 2;
  return parseFloat(((10 ** Lgu) / 100).toFixed(5)); // m²/s cinematic
}

function calcDensity(Tempa: number) {
  const Fct = ((Tempa - 3.983035) ** 2) * (Tempa + 301.797) / (522528.9 * (Tempa + 69.34881));
  return parseFloat((1000 * (1 - Fct)).toFixed(2));
}

function colebrook(NR: number, rug: number, D: number): number {
  let oldf = 1;
  for (let i = 0; i < 1000; i++) {
    const newf = 1 / (-2 * ln(rug / (3.7 * D) + 2.51 / (NR * Math.sqrt(oldf))) * 0.434294482) ** 2;
    const delta = newf - oldf;
    oldf = newf;
    if (Math.abs(delta / newf) < 0.001) break;
  }
  return oldf;
}

const MATERIAL_RUG: Record<Material, number> = {
  AGD: 0.15,
  PVC: 0.0015,
};

// ---- Component ----
export default function PivotCalculator() {
  // Basic inputs
  const [Rut, setRut] = useState("");
  const [Clb, setClb] = useState("");
  const [Lap, setLap] = useState("");
  const [Tgi, setTgi] = useState("");
  const [efc, setEfc] = useState("");
  const [Tempag, setTempag] = useState("25");
  const [material, setMaterial] = useState<Material>("AGD");
  const [rug, setRug] = useState("0.15");
  const [hasCanonSpray, setHasCanonSpray] = useState(false);
  const [Qc, setQc] = useState("0");
  const [Hfin, setHfin] = useState("");
  const [Aclv, setAclv] = useState("0");
  const [Dclv, setDclv] = useState("0");
  const [LTs, setLTs] = useState("");
  const [Alts, setAlts] = useState("0");

  // Diâmetro 1 (único)
  const [Diu, setDiu] = useState("");

  // Diâmetro 2 (dois diâmetros)
  const [Lseg1_2, setLseg1_2] = useState("");
  const [D2s, setD2s] = useState("");

  // Três diâmetros
  const [Lseg1_3, setLseg1_3] = useState("");
  const [Lseg2_3, setLseg2_3] = useState("");
  const [Lseg3_3, setLseg3_3] = useState("");
  const [D2s_3, setD2s_3] = useState("");
  const [D3s_3, setD3s_3] = useState("");

  const [diamConfig, setDiamConfig] = useState<DiamConfig>("1");
  const [results, setResults] = useState<PivotResults | null>(null);
  const [error, setError] = useState("");

  const handleMaterialChange = (mat: Material) => {
    setMaterial(mat);
    setRug(MATERIAL_RUG[mat].toString());
  };

  const calculate = () => {
    setError("");
    try {
      const rut = parseFloat(Rut);
      const clb = parseFloat(Clb);
      const lap = parseFloat(Lap);
      const tgi = parseFloat(Tgi);
      const efcN = parseFloat(efc);
      const tempag = parseFloat(Tempag);
      const rugN = parseFloat(rug);
      const qc = hasCanonSpray ? (parseFloat(Qc) || 0) : 0;
      const hfin = parseFloat(Hfin) || 0;
      const aclv = parseFloat(Aclv) || 0;
      const dclv = parseFloat(Dclv) || 0;
      const lTs = parseFloat(LTs) || 0;
      const alts = parseFloat(Alts) || 0;

      if ([rut, clb, lap, tgi, efcN, tempag, rugN].some(isNaN) ||
          [rut, clb, lap, tgi, efcN].some(v => v <= 0)) {
        setError("Verifique se todos os dados básicos estão preenchidos corretamente.");
        return;
      }

      // Water properties
      const u = calcViscosity(tempag);       // m²/s
      const uc = parseFloat((u * 1000).toFixed(2)); // dynamic ×10⁻³
      const mespag = calcDensity(tempag);

      // Lateral length
      const Lp = rut + clb;

      // Basic irrigated area (ha)
      const Ab = parseFloat((3.14159 * Lp ** 2 / 10000).toFixed(2));

      // Irrigation efficiency
      const efir = parseFloat((efcN / 100).toFixed(2));

      // Required flow (m³/h)
      const Qb = parseFloat((10 * Ab * lap / (efir * tgi)).toFixed(2));

      // Flow at lateral start
      const Qin = parseFloat((qc + Qb).toFixed(2));

      // Ratio γ = Qc/Qin
      const gr = parseFloat((qc / Qin).toFixed(4));

      // Equivalent length
      const Leq = parseFloat((Lp / (1 - gr) ** 0.5).toFixed(1));

      // Slope: only aclive is used for lateral pressure calc (matches original VBA)
      // dclv is kept as input but does not affect Ho/Hpp in the analytical method

      const expm = 2;
      const segments: Seg[] = [];
      let Hftotal = 0;
      let vs1 = 0;
      let Hvel = 0;
      let diu = parseFloat(Diu);

      // ---- 1 diameter ----
      if (diamConfig === "1") {
        if (isNaN(diu) || diu <= 0) { setError("Informe o diâmetro da lateral (mm)."); return; }

        // F and f at full precision for calculation, rounded only for display
        const F_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRDU = Math.floor(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRDU, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        // VBA rounds f to 4dp before using in hf formula
        const Hfdu = parseFloat(((6.376e6) * fs1_disp * Qin ** 2 * Lp * F_raw / diu ** 5).toFixed(2));
        Hftotal = Hfdu;

        segments.push({
          label: "Diâmetro único",
          d: diu.toFixed(1),
          q: Qin.toFixed(2),
          v: vs1.toFixed(2),
          nr: NRDU.toString(),
          f: fs1_disp.toFixed(4),
          F: F_raw.toFixed(4),
          hf: Hfdu.toFixed(2),
        });

        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      // ---- 2 diameters ----
      if (diamConfig === "2") {
        const lseg1 = parseFloat(Lseg1_2);
        const d2s = parseFloat(D2s);
        if (isNaN(diu) || diu <= 0 || isNaN(lseg1) || lseg1 <= 0 || isNaN(d2s) || d2s <= 0) {
          setError("Informe os comprimentos e diâmetros dos segmentos."); return;
        }

        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1_raw = a1 + b1;
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.floor(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRs1, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1_disp * Qin ** 2 * Lp * Fseg1_raw / diu ** 5).toFixed(2));

        segments.push({
          label: "Segmento 1",
          d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2),
          nr: NRs1.toString(), f: fs1_disp.toFixed(4), F: Fseg1_raw.toFixed(5), hf: Hfseg1.toFixed(2),
        });

        const Ftot_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        const Fseg2_raw = Ftot_raw - Fseg1_raw;
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.floor(mespag * v2s * d2s / uc);
        const f2s_raw = colebrook(NR2s, rugN, d2s);
        const f2s_disp = parseFloat(f2s_raw.toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s_disp * Qin ** 2 * Lp * Fseg2_raw / d2s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 2",
          d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2),
          nr: NR2s.toString(), f: f2s_disp.toFixed(4), F: Fseg2_raw.toFixed(5), hf: Hfseg2.toFixed(2),
        });

        Hftotal = parseFloat((Hfseg1 + Hfseg2).toFixed(2));
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      // ---- 3 diameters ----
      if (diamConfig === "3") {
        const lseg1 = parseFloat(Lseg1_3);
        const lseg2 = parseFloat(Lseg2_3);
        const lseg3 = parseFloat(Lseg3_3);
        const d2s = parseFloat(D2s_3);
        const d3s = parseFloat(D3s_3);
        if ([diu, lseg1, lseg2, lseg3, d2s, d3s].some(v => isNaN(v) || v <= 0)) {
          setError("Informe todos os comprimentos e diâmetros dos três segmentos."); return;
        }

        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1_raw = a1 + b1;
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.floor(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRs1, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1_disp * Qin ** 2 * Lp * Fseg1_raw / diu ** 5).toFixed(2));

        segments.push({
          label: "Segmento 1",
          d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2),
          nr: NRs1.toString(), f: fs1_disp.toFixed(4), F: Fseg1_raw.toFixed(4), hf: Hfseg1.toFixed(2),
        });

        const ax = (1 - lseg3 / Lp) - (2 / 3) * (1 - lseg3 / Lp) ** 3 * (1 - gr);
        const bx = ((expm - 1) / (7 - expm)) * (1 - lseg3 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fx_raw = ax + bx;
        const Fseg2_raw = Fx_raw - Fseg1_raw;
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.floor(mespag * v2s * d2s / uc);
        const f2s_raw = colebrook(NR2s, rugN, d2s);
        const f2s_disp = parseFloat(f2s_raw.toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s_disp * Qin ** 2 * Lp * Fseg2_raw / d2s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 2",
          d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2),
          nr: NR2s.toString(), f: f2s_disp.toFixed(4), F: Fseg2_raw.toFixed(4), hf: Hfseg2.toFixed(2),
        });

        const Ftot_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        const Fseg3_raw = Ftot_raw - Fx_raw;
        const Q3s = parseFloat((Qin * (1 - ((lseg1 + lseg2) / Leq) ** 2)).toFixed(2));
        const v3s = parseFloat((353.67765 * Q3s / d3s ** 2).toFixed(2));
        const NR3s = Math.floor(mespag * v3s * d3s / uc);
        const f3s_raw = colebrook(NR3s, rugN, d3s);
        const f3s_disp = parseFloat(f3s_raw.toFixed(4));
        const Hfseg3 = parseFloat(((6.376e6) * f3s_disp * Qin ** 2 * Lp * Fseg3_raw / d3s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 3",
          d: d3s.toFixed(1), q: Q3s.toFixed(2), v: v3s.toFixed(2),
          nr: NR3s.toString(), f: f3s_disp.toFixed(4), F: Fseg3_raw.toFixed(4), hf: Hfseg3.toFixed(2),
        });

        Hftotal = parseFloat((Hfseg1 + Hfseg2 + Hfseg3).toFixed(2));
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      // Pressão no início da lateral (usando netSlope = aclive - declive)
      // Original VBA: Ho = Hfin + Hftotal + (Aclv * Lp / 100) - Hvel (only aclive, not net)
      const Hin = parseFloat((hfin + Hftotal + (aclv * Lp / 100) - Hvel).toFixed(2));

      // Perda de carga no tubo de subida
      const diu2 = parseFloat(Diu);
      const f_riser = parseFloat(colebrook(Math.floor(mespag * vs1 * diu2 / uc), rugN, diu2).toFixed(4));
      const Hfunit = parseFloat(((6.376e6) * f_riser * Qin ** 2 * lTs / diu2 ** 5).toFixed(2));

      // Pressão no ponto do Pivô
      const Hpp = parseFloat((Hin + Hfunit + alts).toFixed(2));

      setResults({
        Lp: Lp.toFixed(2),
        Ab: Ab.toFixed(2),
        Qb: Qb.toFixed(2),
        Qin: Qin.toFixed(2),
        gr: gr.toFixed(4),
        Leq: Leq.toFixed(1),
        segments,
        Hftotal: Hftotal.toFixed(2),
        Hvel: Hvel.toFixed(4),
        Hin: Hin.toFixed(2),
        Hpp: Hpp.toFixed(2),
        viscosity: uc.toFixed(2),
        density: mespag.toFixed(2),
      });
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  return (
    <div className="p-6 space-y-5">

      {/* Row 1 — Basic geometry */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Raio útil — Rut (m)" value={Rut} onChange={setRut} placeholder="Ex: 400" />
        <PInput label="Comprimento do balanço — Clb (m)" value={Clb} onChange={setClb} placeholder="Ex: 50" />
      </div>

      {/* Row 2 — Irrigation parameters */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Lâmina aplicada — Lap (mm)" value={Lap} onChange={setLap} placeholder="Ex: 6" />
        <PInput label="Tempo de irrigação — Tgi (h)" value={Tgi} onChange={setTgi} placeholder="Ex: 24" />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Eficiência — Efc (%)" value={efc} onChange={setEfc} placeholder="Ex: 90" />
        <PInput label="Temperatura da água (°C)" value={Tempag} onChange={setTempag} placeholder="Ex: 25" />
      </div>

      {/* Row 4 — Slope */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Aclive lateral — Aclv (%)" value={Aclv} onChange={setAclv} placeholder="Ex: 0" />
        <PInput label="Declive lateral — Dclv (%)" value={Dclv} onChange={setDclv} placeholder="Ex: 0" />
      </div>

      {/* Row 5 — Pressure / end */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Pressão no final — Hfin (m.c.a.)" value={Hfin} onChange={setHfin} placeholder="Ex: 25" />
        <div /> {/* spacer */}
      </div>

      {/* Row 6 — Rising pipe */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Comp. tubo de subida — LTs (m)" value={LTs} onChange={setLTs} placeholder="Ex: 3" />
        <PInput label="Desnível tubo de subida — Alts (m)" value={Alts} onChange={setAlts} placeholder="Ex: 3" />
      </div>

      {/* Row 7 — Material */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Material da Tubulação
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["AGD", "PVC"] as Material[]).map(mat => (
            <button
              key={mat}
              onClick={() => handleMaterialChange(mat)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all border ${
                material === mat
                  ? "gradient-primary text-primary-foreground border-transparent"
                  : "bg-muted text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {mat === "AGD" ? "AGD° — Aço Galvanizado" : "PVC"}
            </button>
          ))}
        </div>
      </div>

      {/* Row 8 — Roughness */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Rugosidade abs. — rug (mm)" value={rug} onChange={setRug} placeholder="Ex: 0.15" />
        <div /> {/* spacer */}
      </div>

      {/* Row 9 — Cannon/Spray checkbox */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setHasCanonSpray(v => !v)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            hasCanonSpray
              ? "gradient-primary border-transparent"
              : "border-border bg-background"
          }`}
        >
          {hasCanonSpray && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <label
          onClick={() => setHasCanonSpray(v => !v)}
          className="text-sm font-body text-foreground cursor-pointer select-none"
        >
          Possui aspersor canhão/Spray
        </label>
      </div>

      {hasCanonSpray && (
        <PInput label="Vazão canhão/spray — Qc (m³/h)" value={Qc} onChange={setQc} placeholder="Ex: 4.86" />
      )}

      {/* Diameter configuration */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-body">
          Configuração de Diâmetros
        </label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["1", "2", "3"] as DiamConfig[]).map(opt => (
            <button
              key={opt}
              onClick={() => setDiamConfig(opt)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold font-body transition-all border ${
                diamConfig === opt
                  ? "gradient-primary text-primary-foreground border-transparent"
                  : "bg-muted text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {opt === "1" ? "1 Diâmetro" : opt === "2" ? "2 Diâmetros" : "3 Diâmetros"}
            </button>
          ))}
        </div>

        {/* 1 diameter */}
        {diamConfig === "1" && (
          <PInput label="Diâmetro interno — Diu (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
        )}

        {/* 2 diameters */}
        {diamConfig === "2" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <PInput label="Comp. seg. 1 — L1s (m)" value={Lseg1_2} onChange={setLseg1_2} placeholder="Ex: 250" />
              <div /> {/* spacer */}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PInput label="Diâm. seg. 1 — Ds1 (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
              <PInput label="Diâm. seg. 2 — Ds2 (mm)" value={D2s} onChange={setD2s} placeholder="Ex: 143" />
            </div>
          </div>
        )}

        {/* 3 diameters */}
        {diamConfig === "3" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <PInput label="Comp. seg. 1 — L1s (m)" value={Lseg1_3} onChange={setLseg1_3} placeholder="Ex: 150" />
              <PInput label="Comp. seg. 2 — L2s (m)" value={Lseg2_3} onChange={setLseg2_3} placeholder="Ex: 150" />
              <PInput label="Comp. seg. 3 — L3s (m)" value={Lseg3_3} onChange={setLseg3_3} placeholder="Ex: 150" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <PInput label="Diâm. seg. 1 — Ds1 (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
              <PInput label="Diâm. seg. 2 — Ds2 (mm)" value={D2s_3} onChange={setD2s_3} placeholder="Ex: 143" />
              <PInput label="Diâm. seg. 3 — Ds3 (mm)" value={D3s_3} onChange={setD3s_3} placeholder="Ex: 120" />
            </div>
          </div>
        )}
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
        <Waves size={18} />
        Calcular Pivô Central
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-4 pt-2">
          <h3 className="font-display font-semibold text-foreground text-base">Resultados</h3>

          {/* Basic results */}
          <div className="grid grid-cols-2 gap-3">
            <PResultCard label="Comprimento lateral (Lp)" value={`${results.Lp} m`} />
            <PResultCard label="Área básica (Ab)" value={`${results.Ab} ha`} />
            <PResultCard label="Vazão total (Qb)" value={`${results.Qb} m³/h`} />
            <PResultCard label="Vazão início lateral (Qin)" value={`${results.Qin} m³/h`} />
            <PResultCard label="Razão γ = Qc/Qin" value={results.gr} />
            <PResultCard label="Comprimento equiv. (Leq)" value={`${results.Leq} m`} />
          </div>

          {/* Segments */}
          {results.segments.map((seg, i) => (
            <div key={i} className="equation-block rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary font-body">{seg.label} — Ø {seg.d} mm</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground">
                <span>Vazão (Q): <strong className="text-foreground">{seg.q} m³/h</strong></span>
                <span>Velocidade (V): <strong className="text-foreground">{seg.v} m/s</strong></span>
                <span>Reynolds (NR): <strong className="text-foreground">{seg.nr}</strong></span>
                <span>Fator f: <strong className="text-foreground">{seg.f}</strong></span>
                <span>Fator F: <strong className="text-foreground">{seg.F}</strong></span>
                <span>Perda de carga (hf): <strong className="text-primary">{seg.hf} m.c.a.</strong></span>
              </div>
            </div>
          ))}

          {/* Key pressures */}
          <div className="grid grid-cols-2 gap-3">
            <PResultCard label="Hf total lateral" value={`${results.Hftotal} m.c.a.`} highlight />
            <PResultCard label="Carga cinética (Hvel)" value={`${results.Hvel} m`} />
            <PResultCard label="Pressão início lateral (Hin)" value={`${results.Hin} m.c.a.`} />
          </div>

          {/* Main result: pressure at pivot point */}
          <div className="equation-block px-5 py-4">
            <p className="text-xs text-muted-foreground font-body mb-1">Pressão no ponto do Pivô (Hpp)</p>
            <p className="font-display text-2xl font-bold text-primary">
              {results.Hpp} <span className="text-base font-body font-normal">m.c.a.</span>
            </p>
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

function PInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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
        step="any"
        className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}

function PResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "equation-block" : "bg-muted"}`}>
      <p className="text-xs font-body text-muted-foreground">{label}</p>
      <p className={`font-semibold font-body mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
