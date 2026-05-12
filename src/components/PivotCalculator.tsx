import { useState } from "react";
import { Waves, Printer } from "lucide-react";
import TrechoATrechoCalculator, { TrechoState } from "./pivot/TrechoATrechoCalculator";
import PotenciaBombaCalculator, { PotenciaState } from "./pivot/PotenciaBombaCalculator";
import CustoEnergiaCalculator, { CustoState } from "./pivot/CustoEnergiaCalculator";
import PivotReport from "./pivot/PivotReport";

// ---- Types ----
type DiamConfig = "1" | "2" | "3";
type Material = "AGD" | "PVC";
type PivotTab = "dados" | "analitico" | "trechotrecho" | "potencia" | "custo";

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

/** Formata número para padrão brasileiro (vírgula como separador decimal) */
function fmtBR(value: string | number): string {
  return String(value).replace('.', ',');
}

function calcViscosity(Tempa: number) {
  const Tkelv = Tempa + 273.16;
  const Lgu = -11.73 + 1828 / Tkelv + 0.01966 * Tkelv - 0.00001466 * Tkelv ** 2;
  return parseFloat(((10 ** Lgu) / 100).toFixed(5));
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

const PIVOT_TABS: { key: PivotTab; label: string }[] = [
  { key: "dados", label: "Dados" },
  { key: "analitico", label: "Método Analítico" },
  { key: "trechotrecho", label: "Método Trecho a Trecho" },
  { key: "potencia", label: "Potência da Bomba" },
  { key: "custo", label: "Custo de Energia" },
];

// ---- Default states ----
const defaultTrechoState = (): TrechoState => ({
  Eem: "25", Cd: "0.98",
  a: "", b: "", c: "", d: "", fParam: "", modelo: "",
  rows: [], hfTotal: "", h0: "", hpp: "",
});

const defaultPotenciaState = (): PotenciaState => ({
  Lad: "", Dad: "", Dbrec: "150", Dreg: "150", Zrec: "",
  Ampc: "0.3", Rgv: "0.2", Vrt: "3", Curv: "0.4", Rex: "0.2", aplg: "0.1",
  Lsuc: "", Dsuc: "", Zgsuc: "", Dbsuc: "150",
  Rgs: "0.2", Vpc: "5.0", Csuc: "0.4",
  nb: "", nM: "",
  Hftadu: "", Vsuc_res: "", Vad_res: "", Hftsuc: "",
  Hmt: "", Pb: "", Pabs: "",
});

const defaultCustoState = (): CustoState => ({
  tarifaHoro: "Verde", bandeira: "Verde",
  diasTrabalho: "", precoDemandaFP: "",
  horasForaPonta: "", horasPonta: "",
  potenciaComercial: "10", periodo: "Seco",
  tarifaPonta: "", tarifaForaPonta: "", tarifaBandeira: "",
  potDemanda: "", potAbsorvidaKW: "", volumeBombeado: "",
  energiaTotal: "", custoEnergia: "", custoDemanda: "",
  custoFinal: "", custoPorM3: "", custoPorMm: "",
});

// ---- Component ----
export default function PivotCalculator() {
  const [activeTab, setActiveTab] = useState<PivotTab>("dados");
  const [showReport, setShowReport] = useState(false);

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

  // Diâmetros
  const [Diu, setDiu] = useState("");
  const [Lseg1_2, setLseg1_2] = useState("");
  const [D2s, setD2s] = useState("");
  const [Lseg1_3, setLseg1_3] = useState("");
  const [Lseg2_3, setLseg2_3] = useState("");
  const [Lseg3_3, setLseg3_3] = useState("");
  const [D2s_3, setD2s_3] = useState("");
  const [D3s_3, setD3s_3] = useState("");
  const [diamConfig, setDiamConfig] = useState<DiamConfig>("1");

  const [results, setResults] = useState<PivotResults | null>(null);
  const [error, setError] = useState("");

  // Shared output
  const [sharedQin, setSharedQin] = useState(0);
  const [sharedHpp, setSharedHpp] = useState(0);
  const [sharedPabsCV, setSharedPabsCV] = useState(0);

  // ---- Elevated states for sub-tabs ----
  const [trechoState, setTrechoState] = useState<TrechoState>(defaultTrechoState);
  const [potenciaState, setPotenciaState] = useState<PotenciaState>(defaultPotenciaState);
  const [custoState, setCustoState] = useState<CustoState>(defaultCustoState);

  const updateTrecho = (s: Partial<TrechoState>) => setTrechoState(prev => ({ ...prev, ...s }));
  const updatePotencia = (s: Partial<PotenciaState>) => setPotenciaState(prev => ({ ...prev, ...s }));
  const updateCusto = (s: Partial<CustoState>) => setCustoState(prev => ({ ...prev, ...s }));

  const handleMaterialChange = (mat: Material) => {
    setMaterial(mat);
    setRug(MATERIAL_RUG[mat].toString());
  };

  const getShared = () => ({
    Rut: parseFloat(Rut) || 0,
    Clb: parseFloat(Clb) || 0,
    Lap: parseFloat(Lap) || 0,
    Tgi: parseFloat(Tgi) || 0,
    efc: parseFloat(efc) || 0,
    Tempag: parseFloat(Tempag) || 25,
    rug: parseFloat(rug) || 0.15,
    Qc: hasCanonSpray ? (parseFloat(Qc) || 0) : 0,
    Hfin: parseFloat(Hfin) || 0,
    Aclv: parseFloat(Aclv) || 0,
    Dclv: parseFloat(Dclv) || 0,
    LTs: parseFloat(LTs) || 0,
    Alts: parseFloat(Alts) || 0,
    Diu: parseFloat(Diu) || 0,
    D2s: diamConfig === "2" ? (parseFloat(D2s) || 0) : diamConfig === "3" ? (parseFloat(D2s_3) || 0) : 0,
    D3s: parseFloat(D3s_3) || 0,
    Lseg1: diamConfig === "2" ? (parseFloat(Lseg1_2) || 0) : parseFloat(Lseg1_3) || 0,
    Lseg2: parseFloat(Lseg2_3) || 0,
    Lseg3: parseFloat(Lseg3_3) || 0,
    diamConfig,
  });

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
      const lTs = parseFloat(LTs) || 0;
      const alts = parseFloat(Alts) || 0;

      if ([rut, clb, lap, tgi, efcN, tempag, rugN].some(isNaN) ||
          [rut, clb, lap, tgi, efcN].some(v => v <= 0)) {
        setError("Verifique se todos os dados básicos estão preenchidos corretamente.");
        return;
      }

      const u = calcViscosity(tempag);
      const uc = parseFloat((u * 1000).toFixed(2));
      const mespag = calcDensity(tempag);

      const Lp = rut + clb;
      const Ab = parseFloat((3.14159 * Lp ** 2 / 10000).toFixed(2));
      const efir = parseFloat((efcN / 100).toFixed(2));
      const Qb = parseFloat((10 * Ab * lap / (efir * tgi)).toFixed(2));
      const Qin = parseFloat((qc + Qb).toFixed(2));
      const gr = parseFloat((qc / Qin).toFixed(4));
      const Leq = parseFloat((Lp / (1 - gr) ** 0.5).toFixed(1));

      const expm = 2;
      const segments: Seg[] = [];
      let Hftotal = 0;
      let vs1 = 0;
      let Hvel = 0;
      let diu = parseFloat(Diu);

      if (diamConfig === "1") {
        if (isNaN(diu) || diu <= 0) { setError("Informe o diâmetro da lateral (mm)."); return; }
        const F_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRDU = Math.round(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRDU, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        const Hfdu = parseFloat(((6.376e6) * fs1_raw * Qin ** 2 * Lp * F_raw / diu ** 5).toFixed(2));
        Hftotal = Hfdu;
        segments.push({ label: "Diâmetro único", d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2), nr: NRDU.toString(), f: fs1_disp.toFixed(4), F: F_raw.toFixed(4), hf: Hfdu.toFixed(2) });
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      if (diamConfig === "2") {
        const lseg1 = parseFloat(Lseg1_2);
        const d2s = parseFloat(D2s);
        if (isNaN(diu) || diu <= 0 || isNaN(lseg1) || lseg1 <= 0 || isNaN(d2s) || d2s <= 0) { setError("Informe os comprimentos e diâmetros dos segmentos."); return; }
        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1_raw = a1 + b1;
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.round(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRs1, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1_raw * Qin ** 2 * Lp * Fseg1_raw / diu ** 5).toFixed(2));
        segments.push({ label: "Segmento 1", d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2), nr: NRs1.toString(), f: fs1_disp.toFixed(4), F: Fseg1_raw.toFixed(5), hf: Hfseg1.toFixed(2) });
        const Ftot_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        const Fseg2_raw = Ftot_raw - Fseg1_raw;
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.round(mespag * v2s * d2s / uc);
        const f2s_raw = colebrook(NR2s, rugN, d2s);
        const f2s_disp = parseFloat(f2s_raw.toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s_raw * Qin ** 2 * Lp * Fseg2_raw / d2s ** 5).toFixed(2));
        segments.push({ label: "Segmento 2", d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2), nr: NR2s.toString(), f: f2s_disp.toFixed(4), F: Fseg2_raw.toFixed(5), hf: Hfseg2.toFixed(2) });
        Hftotal = parseFloat((Hfseg1 + Hfseg2).toFixed(2));
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      if (diamConfig === "3") {
        const lseg1 = parseFloat(Lseg1_3);
        const lseg2 = parseFloat(Lseg2_3);
        const lseg3 = parseFloat(Lseg3_3);
        const d2s = parseFloat(D2s_3);
        const d3s = parseFloat(D3s_3);
        if ([diu, lseg1, lseg2, lseg3, d2s, d3s].some(v => isNaN(v) || v <= 0)) { setError("Informe todos os comprimentos e diâmetros dos três segmentos."); return; }
        const a1 = (lseg1 / Lp) - (2 / 3) * (lseg1 / Lp) ** 3 * (1 - gr);
        const b1 = ((expm - 1) / (7 - expm)) * (lseg1 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fseg1_raw = a1 + b1;
        vs1 = parseFloat((353.67765 * Qin / diu ** 2).toFixed(2));
        const NRs1 = Math.round(mespag * vs1 * diu / uc);
        const fs1_raw = colebrook(NRs1, rugN, diu);
        const fs1_disp = parseFloat(fs1_raw.toFixed(4));
        const Hfseg1 = parseFloat(((6.376e6) * fs1_raw * Qin ** 2 * Lp * Fseg1_raw / diu ** 5).toFixed(2));
        segments.push({ label: "Segmento 1", d: diu.toFixed(1), q: Qin.toFixed(2), v: vs1.toFixed(2), nr: NRs1.toString(), f: fs1_disp.toFixed(4), F: Fseg1_raw.toFixed(4), hf: Hfseg1.toFixed(2) });
        const ax = (1 - lseg3 / Lp) - (2 / 3) * (1 - lseg3 / Lp) ** 3 * (1 - gr);
        const bx = ((expm - 1) / (7 - expm)) * (1 - lseg3 / Lp) ** (7 - expm) * (1 - gr) ** (3 - expm / 2);
        const Fx_raw = ax + bx;
        const Fseg2_raw = Fx_raw - Fseg1_raw;
        const Q2s = parseFloat((Qin * (1 - (lseg1 / Leq) ** 2)).toFixed(2));
        const v2s = parseFloat((353.67765 * Q2s / d2s ** 2).toFixed(2));
        const NR2s = Math.round(mespag * v2s * d2s / uc);
        const f2s_raw = colebrook(NR2s, rugN, d2s);
        const f2s_disp = parseFloat(f2s_raw.toFixed(4));
        const Hfseg2 = parseFloat(((6.376e6) * f2s_raw * Qin ** 2 * Lp * Fseg2_raw / d2s ** 5).toFixed(2));
        segments.push({ label: "Segmento 2", d: d2s.toFixed(1), q: Q2s.toFixed(2), v: v2s.toFixed(2), nr: NR2s.toString(), f: f2s_disp.toFixed(4), F: Fseg2_raw.toFixed(4), hf: Hfseg2.toFixed(2) });
        const Ftot_raw = 1 - (expm / 3) * (1 - gr) + ((expm - 1) / (7 - expm)) * (1 - gr) ** (3 - expm / 2);
        const Fseg3_raw = Ftot_raw - Fx_raw;
        const Q3s = parseFloat((Qin * (1 - ((lseg1 + lseg2) / Leq) ** 2)).toFixed(2));
        const v3s = parseFloat((353.67765 * Q3s / d3s ** 2).toFixed(2));
        const NR3s = Math.round(mespag * v3s * d3s / uc);
        const f3s_raw = colebrook(NR3s, rugN, d3s);
        const f3s_disp = parseFloat(f3s_raw.toFixed(4));
        const Hfseg3 = parseFloat(((6.376e6) * f3s_raw * Qin ** 2 * Lp * Fseg3_raw / d3s ** 5).toFixed(2));
        segments.push({ label: "Segmento 3", d: d3s.toFixed(1), q: Q3s.toFixed(2), v: v3s.toFixed(2), nr: NR3s.toString(), f: f3s_disp.toFixed(4), F: Fseg3_raw.toFixed(4), hf: Hfseg3.toFixed(2) });
        Hftotal = parseFloat((Hfseg1 + Hfseg2 + Hfseg3).toFixed(2));
        Hvel = parseFloat(((vs1 ** 2 / 19.62) * (2 * (Lp / Leq) ** 2 - (Lp / Leq) ** 4)).toFixed(4));
      }

      const Hin = parseFloat((hfin + Hftotal + (aclv * Lp / 100) - Hvel).toFixed(2));
      const diu2 = parseFloat(Diu);
      const f_riser_raw = colebrook(Math.floor(mespag * vs1 * diu2 / uc), rugN, diu2);
      const Hfunit = parseFloat(((6.376e6) * f_riser_raw * Qin ** 2 * lTs / diu2 ** 5).toFixed(2));
      const Hpp = parseFloat((Hin + Hfunit + alts).toFixed(2));

      setSharedQin(Qin);
      setSharedHpp(Hpp);

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

      setActiveTab("analitico");
    } catch {
      setError("Erro no cálculo. Verifique os dados inseridos.");
    }
  };

  // Build report data
  const reportInputs = {
    Rut, Clb, Lap, Tgi, efc, Tempag, material, rug,
    hasCanonSpray, Qc, Hfin, Aclv, Dclv, LTs, Alts,
    Diu, Lseg1_2, D2s, Lseg1_3, Lseg2_3, Lseg3_3, D2s_3, D3s_3,
    diamConfig,
  };

  return (
    <div>
      {/* Sub-tabs + Print button */}
      <div className="flex border-b border-border overflow-x-auto items-center">
        {PIVOT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold font-body transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0 px-3">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 transition-colors"
          >
            <Printer size={13} />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Dados tab */}
      {activeTab === "dados" && (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Raio até a última torre (m)" value={Rut} onChange={setRut} placeholder="Ex: 400" />
            <PInput label="Comprimento do balanço — Clb (m)" value={Clb} onChange={setClb} placeholder="Ex: 50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Lâmina aplicada — Lap (mm)" value={Lap} onChange={setLap} placeholder="Ex: 6" />
            <PInput label="Tempo de irrigação — Tgi (h)" value={Tgi} onChange={setTgi} placeholder="Ex: 24" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Eficiência — Efc (%)" value={efc} onChange={setEfc} placeholder="Ex: 90" />
            <PInput label="Temperatura da água (°C)" value={Tempag} onChange={setTempag} placeholder="Ex: 25" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Aclive lateral — Aclv (%)" value={Aclv} onChange={setAclv} placeholder="Ex: 0" />
            <PInput label="Declive lateral — Dclv (%)" value={Dclv} onChange={setDclv} placeholder="Ex: 0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Pressão no final — Hfin (m.c.a.)" value={Hfin} onChange={setHfin} placeholder="Ex: 25" />
            <PInput label="ALTURA DO TUBO DE SUBIDA (M)" value={Alts} onChange={setAlts} placeholder="Ex: 3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PInput label="Comp. tubo de subida — LTs (m)" value={LTs} onChange={setLTs} placeholder="Ex: 3" />
            <div />
          </div>

          {/* Material */}
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

          <div className="grid grid-cols-2 gap-4">
            <PInput label="Rugosidade abs. — rug (mm)" value={rug} onChange={setRug} placeholder="Ex: 0.15" />
            <div />
          </div>

          {/* Cannon/Spray */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasCanonSpray(v => !v)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                hasCanonSpray ? "gradient-primary border-transparent" : "border-border bg-background"
              }`}
            >
              {hasCanonSpray && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <label onClick={() => setHasCanonSpray(v => !v)} className="text-sm font-body text-foreground cursor-pointer select-none">
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

            {diamConfig === "1" && (
              <PInput label="Diâmetro interno — Diu (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
            )}
            {diamConfig === "2" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <PInput label="Comp. seg. 1 — L1s (m)" value={Lseg1_2} onChange={setLseg1_2} placeholder="Ex: 250" />
                  <div />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PInput label="Diâm. seg. 1 — Ds1 (mm)" value={Diu} onChange={setDiu} placeholder="Ex: 168" />
                  <PInput label="Diâm. seg. 2 — Ds2 (mm)" value={D2s} onChange={setD2s} placeholder="Ex: 143" />
                </div>
              </div>
            )}
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

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg font-body">
              ⚠ {error}
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl font-body flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
          >
            <Waves size={18} />
            Calcular — Método Analítico
          </button>
        </div>
      )}

      {/* Método Analítico tab */}
      {activeTab === "analitico" && (
        <div className="p-6 space-y-4">
          {!results ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">
              Preencha os dados na aba <strong>Dados</strong> e pressione Calcular.
            </div>
          ) : (
            <>
              <h3 className="font-display font-semibold text-foreground text-base">Resultados — Método Analítico</h3>

              {/* Row 1: Ab / Qb */}
              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Área básica (Ab)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.Ab)} ha</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Vazão na área básica (Qb)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.Qb)} m³/h</p>
                </div>
              </div>

              {/* Row 2: Qin / Razão */}
              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Vazão no início da lateral (Qin)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.Qin)} m³/h</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Razão (Qc/Qin)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.gr)}</p>
                </div>
              </div>

              {/* Row 3: Leq / Hf total */}
              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Comp. equivalente da lateral (m)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.Leq)} m</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-muted-foreground">Hf total (m)</span>
                  <p className="font-semibold text-foreground">{fmtBR(results.Hftotal)} m</p>
                </div>
              </div>

              {/* Row 4: Ho / Hpp - bordered boxes */}
              <div className="grid grid-cols-2 gap-3 text-xs font-body">
                <div className="bg-muted border border-border rounded-lg p-3 text-center">
                  <span className="text-muted-foreground text-xs">Ho (m)</span>
                  <p className="font-bold text-foreground text-xl mt-1">{fmtBR(results.Hin)}</p>
                </div>
                <div className="bg-muted border border-border rounded-lg p-3 text-center">
                  <span className="text-muted-foreground text-xs">Hpp (m)</span>
                  <p className="mt-1"><span className="font-bold text-primary text-2xl">{fmtBR(results.Hpp)}</span> <span className="text-sm font-normal text-muted-foreground">m.ca</span></p>
                </div>
              </div>

              {/* Segments */}
              {results.segments.map((seg, i) => (
                <fieldset key={i} className="border border-border rounded-xl p-4 space-y-2">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-primary px-2 font-body">
                    {results.segments.length === 1
                      ? `Diâmetro único — Ø ${fmtBR(seg.d || "")} mm`
                      : `${i + 1}º Segmento — Ø ${fmtBR(seg.d || "")} mm`}
                  </legend>
                  <div className="grid grid-cols-2 gap-2 text-xs font-body">
                    <span className="text-muted-foreground">Fator de Correção (F): <strong className="text-foreground">{fmtBR(seg.F)}</strong></span>
                    <span className="text-muted-foreground">Velocidade da água (m/s): <strong className="text-foreground">{fmtBR(seg.v)}</strong></span>
                    <span className="text-muted-foreground">Vazão (m³/h): <strong className="text-foreground">{fmtBR(seg.q)}</strong></span>
                    <span className="text-muted-foreground">Número de Reynolds: <strong className="text-foreground">{seg.nr}</strong></span>
                    <span className="text-muted-foreground">Fator de atrito (f) Colebrook: <strong className="text-foreground">{fmtBR(seg.f)}</strong></span>
                    <span className="text-muted-foreground">Perda de carga (m): <strong className="text-primary">{fmtBR(seg.hf)}</strong></span>
                  </div>
                </fieldset>
              ))}

              {/* Bottom info: Carga cinética, Viscosidade, Massa específica */}
              <div className="text-xs font-body text-muted-foreground space-y-1 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <span>Carga cinética (Hvel): <strong className="text-foreground">{fmtBR(results.Hvel || "—")} m</strong></span>
                  <span>Viscosidade: <strong className="text-foreground">{fmtBR(results.viscosity)} × 10⁻³ Ns/m²</strong></span>
                </div>
                <div>
                  <span>Massa específica: <strong className="text-foreground">{fmtBR(results.density)} kg/m³</strong></span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Método Trecho a Trecho tab */}
      {activeTab === "trechotrecho" && (
        <TrechoATrechoCalculator
          shared={getShared()}
          state={trechoState}
          onStateChange={updateTrecho}
          onHpp={(hpp) => setSharedHpp(hpp)}
        />
      )}

      {/* Potência da Bomba tab */}
      {activeTab === "potencia" && (
        <PotenciaBombaCalculator
          Qin={sharedQin || (parseFloat(results?.Qin ?? "0"))}
          Hpp={sharedHpp || (parseFloat(results?.Hpp ?? "0"))}
          rug={parseFloat(rug) || 0.15}
          Tempag={parseFloat(Tempag) || 25}
          state={potenciaState}
          onStateChange={updatePotencia}
          onPabs={(p) => setSharedPabsCV(p)}
        />
      )}

      {/* Custo de Energia tab */}
      {activeTab === "custo" && (
        <CustoEnergiaCalculator
          Qin={sharedQin || (parseFloat(results?.Qin ?? "0"))}
          Tgi={parseFloat(Tgi) || 0}
          PabsCV={sharedPabsCV}
          state={custoState}
          onStateChange={updateCusto}
        />
      )}

      {/* Report modal */}
      {showReport && (
        <PivotReport
          inputs={reportInputs}
          results={results}
          trechoState={trechoState}
          potenciaState={potenciaState}
          custoState={custoState}
          onClose={() => setShowReport(false)}
        />
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
        className="w-full px-3 py-2 rounded-lg border text-sm font-body bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground no-spinner"
        style={{ borderColor: "hsl(var(--border))" }}
      />
    </div>
  );
}
