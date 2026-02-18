import { useState } from "react";
import { Waves } from "lucide-react";

// ---- Types ----
type DiamConfig = "1" | "2" | "3";

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

// ---- Component ----
export default function PivotCalculator() {
  // Basic inputs
  const [Rut, setRut] = useState("");
  const [Clb, setClb] = useState("");
  const [Lap, setLap] = useState("");
  const [Tgi, setTgi] = useState("");
  const [efc, setEfc] = useState("");
  const [Tempag, setTempag] = useState("25");
  const [rug, setRug] = useState("0.15");
  const [Qc, setQc] = useState("0");
  const [Hfin, setHfin] = useState("");
  const [Aclv, setAclv] = useState("0");
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
      const qc = parseFloat(Qc) || 0;
      const hfin = parseFloat(Hfin) || 0;
      const aclv = parseFloat(Aclv) || 0;
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

      const expm = 2;
      const segments: Seg[] = [];
      let Hftotal = 0;
      let vs1 = 0;
      let Hvel = 0;
      let diu = parseFloat(Diu);

      // ---- 1 diameter ----
      if (diamConfig === "1") {
        if (isNaN(diu) || diu <= 0) { setError("Informe o diâmetro da lateral (mm)."); return; }

        const F = parseFloat((1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2)).toFixed(4));
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRDU = Math.round(mespag * vs1 * diu / uc);
        const fs1 = parseFloat(colebrook(NRDU, rugN, diu).toFixed(4));
        const Hfdu = parseFloat(((6.376e6) * fs1 * Qin ** 2 * Lp * F / diu ** 5).toFixed(2));
        Hftotal = Hfdu;

        segments.push({
          label: "Diâmetro único",
          d: diu.toFixed(1),
          q: Qin.toFixed(2),
          v: vs1.toFixed(2),
          nr: NRDU.toString(),
          f: fs1.toFixed(4),
          F: F.toFixed(4),
          hf: Hfdu.toFixed(2),
        });

        // Carga cinética
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      // ---- 2 diameters ----
      if (diamConfig === "2") {
        const lseg1 = parseFloat(Lseg1_2);
        const d2s = parseFloat(D2s);
        if (isNaN(diu) || diu <= 0 || isNaN(lseg1) || lseg1 <= 0 || isNaN(d2s) || d2s <= 0) {
          setError("Informe os comprimentos e diâmetros dos segmentos."); return;
        }

        // Seg 1
        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1 = parseFloat((a1 + b1).toFixed(5));
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.round(mespag * vs1 * diu / uc);
        const fs1 = parseFloat(colebrook(NRs1, rugN, diu).toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1 * Qin ** 2 * Lp * Fseg1 / diu ** 5).toFixed(2));

        segments.push({
          label: "Segmento 1",
          d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2),
          nr: NRs1.toString(), f: fs1.toFixed(4), F: Fseg1.toFixed(5), hf: Hfseg1.toFixed(2),
        });

        // Seg 2
        const Ftot = parseFloat((1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2)).toFixed(5));
        const Fseg2 = parseFloat((Ftot - Fseg1).toFixed(5));
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.round(mespag * v2s * d2s / uc);
        const f2s = parseFloat(colebrook(NR2s, rugN, d2s).toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s * Qin ** 2 * Lp * Fseg2 / d2s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 2",
          d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2),
          nr: NR2s.toString(), f: f2s.toFixed(4), F: Fseg2.toFixed(5), hf: Hfseg2.toFixed(2),
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

        // Seg 1
        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1 = parseFloat((a1 + b1).toFixed(4));
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.round(mespag * vs1 * diu / uc);
        const fs1 = parseFloat(colebrook(NRs1, rugN, diu).toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1 * Qin ** 2 * Lp * Fseg1 / diu ** 5).toFixed(2));

        segments.push({
          label: "Segmento 1",
          d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2),
          nr: NRs1.toString(), f: fs1.toFixed(4), F: Fseg1.toFixed(4), hf: Hfseg1.toFixed(2),
        });

        // Seg 2
        const ax = (1 - lseg3 / Lp) - (2 / 3) * (1 - lseg3 / Lp) ** 3 * (1 - gr);
        const bx = ((expm - 1) / (7 - expm)) * (1 - lseg3 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fx = parseFloat((ax + bx).toFixed(4));
        const Fseg2 = parseFloat((Fx - Fseg1).toFixed(4));
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.round(mespag * v2s * d2s / uc);
        const f2s = parseFloat(colebrook(NR2s, rugN, d2s).toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s * Qin ** 2 * Lp * Fseg2 / d2s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 2",
          d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2),
          nr: NR2s.toString(), f: f2s.toFixed(4), F: Fseg2.toFixed(4), hf: Hfseg2.toFixed(2),
        });

        // Seg 3
        const Ftot = parseFloat((1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2)).toFixed(6));
        const Fseg3 = parseFloat((Ftot - Fx).toFixed(6));
        const Q3s = parseFloat((Qin * (1 - ((lseg1 + lseg2) / Leq) ** 2)).toFixed(2));
        const v3s = parseFloat((353.67765 * Q3s / d3s ** 2).toFixed(2));
        const NR3s = Math.round(mespag * v3s * d3s / uc);
        const f3s = parseFloat(colebrook(NR3s, rugN, d3s).toFixed(4));
        const Hfseg3 = parseFloat(((6.376e6) * f3s * Qin ** 2 * Lp * Fseg3 / d3s ** 5).toFixed(2));

        segments.push({
          label: "Segmento 3",
          d: d3s.toFixed(1), q: Q3s.toFixed(2), v: v3s.toFixed(2),
          nr: NR3s.toString(), f: f3s.toFixed(4), F: Fseg3.toFixed(6), hf: Hfseg3.toFixed(2),
        });

        Hftotal = parseFloat((Hfseg1 + Hfseg2 + Hfseg3).toFixed(2));
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      // Pressão no início da lateral
      const Hin = parseFloat((hfin + Hftotal + (aclv * Lp / 100) - Hvel).toFixed(2));

      // Perda de carga no tubo de subida
      const diu2 = parseFloat(Diu);
      const Hfunit = parseFloat(((6.376e6) * colebrook(Math.round(mespag * vs1 * diu2 / uc), rugN, diu2) * Qin ** 2 * lTs / diu2 ** 5).toFixed(2));

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

  const lTs = parseFloat(LTs);

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
        <PInput label="Eficiência — efc (%)" value={efc} onChange={setEfc} placeholder="Ex: 90" />
        <PInput label="Temperatura da água (°C)" value={Tempag} onChange={setTempag} placeholder="Ex: 25" />
      </div>

      {/* Row 4 — Pressure / topography */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Pressão no final — Hfin (m.c.a.)" value={Hfin} onChange={setHfin} placeholder="Ex: 25" />
        <PInput label="Aclive lateral — Aclv (%)" value={Aclv} onChange={setAclv} placeholder="Ex: 0" />
      </div>

      {/* Row 5 — Rising pipe */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Comp. tubo de subida — LTs (m)" value={LTs} onChange={setLTs} placeholder="Ex: 3" />
        <PInput label="Desnível tubo de subida — Alts (m)" value={Alts} onChange={setAlts} placeholder="Ex: 3" />
      </div>

      {/* Row 6 — Cannon spray + roughness */}
      <div className="grid grid-cols-2 gap-4">
        <PInput label="Vazão canhão/spray — Qc (m³/h)" value={Qc} onChange={setQc} placeholder="Ex: 0" />
        <PInput label="Rugosidade abs. — rug (mm)" value={rug} onChange={setRug} placeholder="Ex: 0.15" />
      </div>

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
            <PInput label="Diâmetro interno — Diu (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
            <div className="grid grid-cols-2 gap-3">
              <PInput label="Comp. seg. 1 — Lseg1 (m)" value={Lseg1_2} onChange={setLseg1_2} placeholder="Ex: 250" />
              <PInput label="Diâm. seg. 2 — D2s (mm)" value={D2s} onChange={setD2s} placeholder="Ex: 143" />
            </div>
          </div>
        )}

        {/* 3 diameters */}
        {diamConfig === "3" && (
          <div className="space-y-3">
            <PInput label="Diâmetro interno — Diu (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
            <div className="grid grid-cols-2 gap-3">
              <PInput label="Comp. seg. 1 — Lseg1 (m)" value={Lseg1_3} onChange={setLseg1_3} placeholder="Ex: 150" />
              <PInput label="Comp. seg. 2 — Lseg2 (m)" value={Lseg2_3} onChange={setLseg2_3} placeholder="Ex: 150" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PInput label="Comp. seg. 3 — Lseg3 (m)" value={Lseg3_3} onChange={setLseg3_3} placeholder="Ex: 150" />
              <PInput label="Diâm. seg. 2 — D2s (mm)" value={D2s_3} onChange={setD2s_3} placeholder="Ex: 143" />
            </div>
            <PInput label="Diâm. seg. 3 — D3s (mm)" value={D3s_3} onChange={setD3s_3} placeholder="Ex: 120" />
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
